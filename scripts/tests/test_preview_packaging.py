import importlib.util
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

SPEC = importlib.util.spec_from_file_location('packager', Path(__file__).resolve().parents[1] / 'build_previews.py')
packager = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(packager)


class PackagingContract(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.output = self.root / 'build/pages'
        (self.root / 'previews').mkdir()
        (self.root / 'previews/index.template.html').write_text('{{VERSION_CARDS}}{{VERSION_COUNT}}')
        self.version = self.root / 'V0.32'
        self.version.mkdir()
        (self.version / 'Mahalino+V0.32.html').write_text('<script src="asset.js"></script>')
        (self.version / 'asset.js').write_text('var ok=true;')
        (self.version / 'build_v032.js').write_text('// builder')
        (self.version / 'README.md').write_text('source contract')
        for name, value in [('ROOT', self.root), ('OUTPUT', self.output)]:
            p = patch.object(packager, name, value)
            p.start()
            self.addCleanup(p.stop)

    def test_source_package_has_builder_and_exact_manifest(self):
        self.assertEqual(packager.build(), [32])
        packager.verify([32])
        self.assertTrue((self.output / 'v0.32/build_v032.js').is_file())

    def test_v033_source_package_remains_rebuildable_alongside_v032(self):
        version = self.root / 'V0.33'
        version.mkdir()
        (version / 'Mahalino+V0.33.html').write_text('<script src="asset.js"></script>')
        (version / 'asset.js').write_text('var ok=true;')
        (version / 'build_v033.js').write_text('// builder')
        (version / 'README.md').write_text('source contract')
        self.assertEqual(packager.build(), [33, 32])
        packager.verify([33, 32])
        import json
        source = self.output / 'v0.33'
        self.assertTrue((source / 'build_v033.js').is_file())
        self.assertEqual(json.loads((source / 'package-manifest.json').read_text())['kind'], 'rebuildable-source')
        self.assertTrue((self.output / 'v0.32/build_v032.js').is_file())

    def test_missing_asset_preserves_previous_output(self):
        packager.build()
        (self.output / 'marker').write_text('previous')
        (self.version / 'asset.js').unlink()
        with self.assertRaises(AssertionError):
            packager.build()
        self.assertEqual((self.output / 'marker').read_text(), 'previous')

    def test_mid_build_failure_preserves_previous_output(self):
        packager.build()
        (self.output / 'marker').write_text('previous')
        with patch.object(packager, 'create_zip', side_effect=OSError('injected')):
            with self.assertRaises(OSError):
                packager.build()
        self.assertTrue((self.output / 'marker').is_file())
        self.assertFalse(list(self.output.parent.glob('.pages-stage-*')))

    def test_dependencies_metadata_and_symlinks_are_excluded(self):
        (self.version / 'node_modules').mkdir()
        (self.version / 'node_modules/secret.js').write_text('excluded')
        (self.version / 'desktop.ini').write_text('excluded')
        (self.version / 'symlink.js').symlink_to(self.version / 'asset.js')
        packager.build()
        for item in ['node_modules', 'desktop.ini', 'symlink.js']:
            self.assertFalse((self.output / 'v0.32' / item).exists())

    def test_incomplete_version_does_not_replace_output(self):
        packager.build()
        (self.version / 'Mahalino+V0.32.html').unlink()
        with self.assertRaises(ValueError):
            packager.build()
        self.assertTrue((self.output / 'v0.32/index.html').is_file())
