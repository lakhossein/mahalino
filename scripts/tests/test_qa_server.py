import importlib.util
from pathlib import Path
import socket
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch, MagicMock

QA = Path(__file__).resolve().parents[2] / 'V0.32/qa'
SPEC = importlib.util.spec_from_file_location('probe', QA / 'verify-http-artifact.py')
probe = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(probe)


class ServerIdentity(unittest.TestCase):
    def test_occupied_port_cannot_create_readiness(self):
        with socket.socket() as occupied, tempfile.TemporaryDirectory() as directory:
            occupied.bind(('127.0.0.1', 0))
            occupied.listen()
            ready = Path(directory) / 'ready.json'
            result = subprocess.run([sys.executable, str(QA / 'serve-artifact.py'), '--port', str(occupied.getsockname()[1]), '--directory', directory, '--ready', str(ready)], capture_output=True, timeout=5)
            self.assertNotEqual(result.returncode, 0)
            self.assertFalse(ready.exists())

    def test_wrong_success_response_is_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            artifact = Path(directory) / 'artifact'
            artifact.write_bytes(b'expected')
            response = MagicMock()
            response.__enter__.return_value.read.return_value = b'wrong HTTP 200'
            with patch.object(probe, 'urlopen', return_value=response):
                with self.assertRaises(ValueError):
                    probe.verify('http://localhost/', artifact)
            response.__enter__.return_value.read.return_value = b'expected'
            with patch.object(probe, 'urlopen', return_value=response):
                probe.verify('http://localhost/', artifact)
