"""Local regressions: no Home Assistant, network, deployment or git writes."""
import ast
import importlib.util
import os
from pathlib import Path
import re
import shutil
import subprocess
import tempfile
import unittest

import yaml

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('updates', ROOT / 'apply_updates.py')
updates = importlib.util.module_from_spec(spec)
spec.loader.exec_module(updates)


def snapshot(root):
    return {str(p.relative_to(root)): p.read_bytes()
            for p in root.rglob('*') if p.is_file() and '__pycache__' not in p.parts}


def run_script(name, root):
    return subprocess.run(['python3', str(ROOT / name)], check=True,
                          env={**os.environ, 'HA_CONFIG_ROOT': str(root),
                               'PYTHONDONTWRITEBYTECODE': '1'},
                          capture_output=True, text=True)


class LocalFixTests(unittest.TestCase):
    def test_generator_two_runs_and_repository_parity(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / 'dashboards').mkdir()
            shutil.copy(ROOT / 'dashboards/zuhause.yaml', root / 'dashboards/zuhause.yaml')
            run_script('generate_personal_dashboards.py', root)
            first = snapshot(root)
            run_script('generate_personal_dashboards.py', root)
            self.assertEqual(first, snapshot(root), 'Second generator run must have an empty diff')
            for profile in ('timo', 'juli', 'mika', 'gabi'):
                rel = f'dashboards/{profile}.yaml'
                self.assertEqual(first[rel], (ROOT / rel).read_bytes(), rel)

    def test_yaml_navigation_and_navbars(self):
        for p in sorted((ROOT / 'dashboards').glob('*.yaml')):
            with self.subTest(dashboard=p.name):
                data = yaml.safe_load(p.read_text())
                paths = [view['path'] for view in data['views']]
                self.assertEqual(len(paths), 14)
                self.assertEqual(len(paths), len(set(paths)))
                prefix = 'x' if p.stem == 'zuhause' else p.stem
                template = p.stem + '_nav'
                self.assertEqual(set(data['navbar-templates']), {template})
                def walk(value):
                    if isinstance(value, dict):
                        for key, item in value.items():
                            if key in ('navigation_path', 'back_path', 'url') and isinstance(item, str) and item.startswith('/dashboard-'):
                                panel, view = item.strip('/').split('/')
                                self.assertEqual(panel, 'dashboard-' + prefix)
                                self.assertIn(view, paths)
                            if value.get('type') == 'custom:navbar-card':
                                self.assertEqual(value['template'], template)
                            walk(item)
                    elif isinstance(value, list):
                        for item in value:
                            walk(item)
                walk(data)

    def test_complete_runtime_twice_and_generator_parity(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            shutil.copytree(ROOT / 'dashboards', root / 'dashboards')
            (root / 'www').mkdir()
            for name in ('zuhause.yaml', 'timo.yaml', 'apple-optik.js'):
                shutil.copy(ROOT / name, root / name)
            shutil.copy(ROOT / 'apple-optik.js', root / 'www/apple-optik.js')
            run_script('apply_updates.py', root)
            first = snapshot(root)
            run_script('apply_updates.py', root)
            self.assertEqual(first, snapshot(root), 'Second runtime run must have an empty diff')
            patched_dashboards = snapshot(root / 'dashboards')
            run_script('generate_personal_dashboards.py', root)
            self.assertEqual(patched_dashboards, snapshot(root / 'dashboards'))
            self.assertEqual((root / 'apple-optik.js').read_bytes(), (ROOT / 'apple-optik.js').read_bytes())
            self.assertEqual((root / 'www/apple-optik.js').read_bytes(), (ROOT / 'apple-optik.js').read_bytes())

    def test_css_migration_all_occurrences_in_one_run(self):
        css = '''const VERSION = "1.9.18";
const CSS = `html::before, html::after {content: "";}
html::before {opacity: 1;} html::after {opacity: 0;}
@media (prefers-reduced-motion: reduce) {
 html::before, html::after {transition: none;}
}
html::before {filter: saturate(0.7);}
html.apple-wash-animating::before, html.apple-wash-animating::after {opacity: 1;}`;
const mediaVersion = "1.5.0";
'''
        with tempfile.TemporaryDirectory() as tmp:
            p = Path(tmp) / 'legacy.js'
            p.write_text(css)
            updates.patch_js(p)
            first = p.read_bytes()
            self.assertNotIn('html::before', p.read_text())
            self.assertNotIn('html::after', p.read_text())
            self.assertNotIn('html.apple-wash', p.read_text())
            self.assertIn('"1.5.0"', p.read_text())
            updates.patch_js(p)
            self.assertEqual(first, p.read_bytes())
            subprocess.run(['node', '--check', str(p)], check=True, capture_output=True)

    def test_legacy_yaml_migration_is_idempotent(self):
        for room in (updates.JULI_PLACEHOLDER, updates.JULI_TV):
            with self.subTest(room=room), tempfile.TemporaryDirectory() as tmp:
                p = Path(tmp) / 'legacy.yaml'
                p.write_text('views:\n  - title: Medien\n    path: medien\n' + updates.MIKA_TV +
                             '\n  - title: Juli\n    path: juli-zimmer\n' + room +
                             '\n  - title: Wohnzimmer\n    path: wohnzimmer\n' + updates.TV)
                updates.patch_yaml(p)
                first = p.read_bytes()
                updates.patch_yaml(p)
                self.assertEqual(first, p.read_bytes())
                self.assertNotIn(updates.TV, p.read_text())
                self.assertIn(updates.JULI_GROUPED, p.read_text())

    def test_deploy_source_contract_without_running_deploy(self):
        source = (ROOT / 'deploy.sh').read_text().replace('\\\n', ' ')
        self.assertEqual((ROOT / 'deploy.sh').stat().st_mode & 0o777, 0o755)
        checkout = re.search(r'git -C /config checkout origin/main -- (.+)', source)[1].split()
        self.assertIn('dashboards/zuhause.yaml', checkout)
        self.assertNotIn('zuhause.yaml', checkout)
        copies = re.findall(r'^copy_one (\S+) (\S+)$', source, re.M)
        self.assertFalse(any(dst == '/config/dashboards/zuhause.yaml' for _, dst in copies))
        for name in ('apple-optik.js', 'apple-mobile-gradient.js'):
            self.assertIn(name, checkout)
            self.assertIn('need /config/' + name, source)
            self.assertIn(('/config/' + name, '/config/www/' + name), copies)
            self.assertTrue((ROOT / name).is_file())

    def test_cache_versions(self):
        config = (ROOT / 'configuration.yaml').read_text()
        version = re.search(r'const VERSION = "([^"]+)"', (ROOT / 'apple-optik.js').read_text())[1]
        self.assertEqual(version, updates.VERSION)
        self.assertIn('/local/apple-optik.js?v=' + version, config)
        self.assertIn('/local/apple-mobile-gradient.js?v=6', config)

    def test_syntax(self):
        yaml_paths = list(ROOT.glob('*.yaml')) + list((ROOT / 'dashboards').glob('*.yaml'))
        yaml_paths += list((ROOT / 'themes').glob('*.yaml'))
        yaml_paths += list((ROOT / '.github/workflows').glob('*.yml'))
        for path in yaml_paths:
            yaml.load(path.read_text(), Loader=yaml.BaseLoader)
        for path in list(ROOT.glob('*.py')) + list((ROOT / 'tests').glob('*.py')):
            ast.parse(path.read_text(), filename=str(path))
        for path in ROOT.glob('*.js'):
            subprocess.run(['node', '--check', str(path)], check=True, capture_output=True)
        subprocess.run(['bash', '-n', str(ROOT / 'deploy.sh')], check=True, capture_output=True)


if __name__ == '__main__':
    unittest.main(verbosity=2)
