sudo find / -name "HA-CONFIG" -type d 2>/dev/null
# Alternativ, falls Home Assistant als Docker läuft:
sudo docker inspect homeassistant 2>/dev/null | grep -i config