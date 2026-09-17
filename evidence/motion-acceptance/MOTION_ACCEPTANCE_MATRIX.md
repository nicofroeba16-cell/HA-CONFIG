# Motion Acceptance Matrix

- Tested source HEAD: `18e189cc1f6a5ee9c44f608f8a4a6f778c18a3db`
- Source baseline: `411b7b2c4057812f0fd3cf256b9342fdc3250fc8`
- Generated: `2026-09-17T23:20:48.132Z`
- Mode: repo simulation only; no authenticated/live Home Assistant access

| Interaction | Expected behavior | Evidence | Result | Defect / fix / retest |
|---|---|---|---|---|
| Dashboard open/switch | Dashboard opens stable with no layout jump and correct gradient state. | 393x852, 430x932, 375x812 recordings | PASS | PASS after final post-reload rerun. |
| Navigation crossfade | Single restrained route wash; no stacked/ghost transition; newest route wins. | 393x852, 430x932, 375x812 recordings | PASS | PASS after final post-reload rerun. |
| Card press/release repeated | Immediate restrained scale feedback; release returns cleanly; input remains responsive. | 393x852, 430x932, 375x812 recordings | PASS | PASS after final post-reload rerun. |
| Detail open/close repeated | Smooth bounded detail entrance/exit; no jump or blocked input. | 393x852, 430x932, 375x812 recordings | PASS | PASS after final post-reload rerun. |
| Light entity transitions | State/UI transition without card jump or layout reflow. | 393x852, 430x932, 375x812 recordings | PASS | PASS after final post-reload rerun. |
| Media state transitions | Idle/playing changes remain smooth and bounded. | 393x852, 430x932, 375x812 recordings | PASS | PASS after final post-reload rerun. |
| Loading → ready | Loading opacity resolves to ready without reflow. | 393x852, 430x932, 375x812 recordings | PASS | PASS after final post-reload rerun. |
| Unavailable → available | Unavailable state restores cleanly without ghosting. | 393x852, 430x932, 375x812 recordings | PASS | PASS after final post-reload rerun. |
| Reconnect restored | Disconnected/restored simulation returns to stable ready state. | 393x852, 430x932, 375x812 recordings | PASS | PASS after final post-reload rerun. |
| Explicit hard reload → ready | `Page.reload(ignoreCache=true)` returns to stable dashboard with motion layer initialized once. | 393x852, 430x932, 375x812 recordings | PASS | PASS after final post-reload rerun. |
| Rapid repeated navigation settles | Repeated destinations settle on latest route; no duplicate animation remains. | 393x852, 430x932, 375x812 recordings | PASS | PASS after final post-reload rerun. |
| Reduce Motion / Reduce Transparency | Motion collapses to near-instant transitions; blur/transparency reduced. | `iphone-393x852-reduced-motion.avi` | PASS | PASS after final post-reload rerun. |
| DOM/style mutation stress | 60 add/remove mutations cause no DOM growth or duplicate styles. | all videos + `results.json` before/after diagnostics | PASS | Initial duplicate transparency-style defect fixed; retest stays 64→64 DOM nodes with style counts 1/1/1. |
| Horizontal overflow / console errors | No horizontal overflow and no runtime/log error entries. | 393x852, 430x932, 375x812 recordings | PASS | PASS after final post-reload rerun. |
