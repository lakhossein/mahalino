from pathlib import Path
import subprocess
import unittest

ROOT = Path(__file__).resolve().parents[2]


class RepositoryHygiene(unittest.TestCase):
    def test_generated_dependencies_and_desktop_metadata_are_not_tracked(self):
        names = subprocess.check_output(['git', 'ls-files', '-z'], cwd=ROOT, text=True).split('\0')
        self.assertFalse([p for p in names if p and ('node_modules' in Path(p).parts or Path(p).name.lower() == 'desktop.ini')])

    def test_historical_runtime_has_no_changed_files(self):
        names = subprocess.check_output(['git', 'diff', '--name-only', 'ba0591ec114898e87813fbf06898823bdb17a6b3'], cwd=ROOT, text=True).splitlines()
        import re
        historical = [p for p in names if re.match(r'V0\.(?:[1-9]|[12][0-9]|3[01])/', p)]
        allowed = [p for p in historical if 'node_modules' in Path(p).parts or Path(p).name.lower() == 'desktop.ini' or p == 'V0.31/qa/check-release-identity.cjs']
        self.assertEqual(sorted(historical), sorted(allowed))
