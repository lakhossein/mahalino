"""Regression contract for Pages dependencies; run with PyYAML installed.

These inspect workflow configuration, not a GitHub Actions runner simulation.
"""
import fnmatch
from pathlib import Path
import unittest

import yaml

ROOT = Path(__file__).resolve().parents[2]


def load_workflow(name):
    # BaseLoader preserves the Actions key `on` (YAML 1.1 treats it as bool).
    return yaml.load((ROOT / '.github/workflows' / name).read_text(), Loader=yaml.BaseLoader)


class PagesPublicationContract(unittest.TestCase):
    def setUp(self):
        self.pages = load_workflow('pages.yml')

    def test_all_versions_are_required_dependencies(self):
        required = {'quality-v030', 'quality-v031', 'quality-v032', 'workflow-contract'}
        self.assertTrue(required.issubset(self.pages['jobs']['publish']['needs']))

    def test_quality_jobs_call_local_callable_gates_without_skip_conditions(self):
        for version in ('030', '031', '032'):
            with self.subTest(version=version):
                job = self.pages['jobs'][f'quality-v{version}']
                filename = f'mahalino-v{version}-quality-gate.yml'
                self.assertEqual(job['uses'], f'./.github/workflows/{filename}')
                self.assertNotIn('if', job)
                self.assertIn('workflow_call', load_workflow(filename)['on'])
                self.assertNotIn('continue-on-error', job)

    def test_publish_preserves_implicit_success_condition(self):
        # A plain event condition keeps Actions' implicit success() check.
        # always()/!cancelled() here could allow failed dependencies to deploy.
        self.assertEqual(self.pages['jobs']['publish']['if'], "github.event_name != 'pull_request'")
        self.assertNotIn('continue-on-error', self.pages['jobs']['publish'])

    def test_push_and_pr_cover_every_gate_and_contract_test(self):
        paths = [
            'V0.32/src/legacy/utilities.js', 'previews/index.html',
            'scripts/build_previews.py', 'scripts/tests/test_pages_workflow.py',
            '.github/workflows/pages.yml',
            *[f'.github/workflows/mahalino-v{v}-quality-gate.yml' for v in ('030', '031', '032')],
        ]
        for event in ('push', 'pull_request'):
            with self.subTest(event=event):
                trigger = self.pages['on'][event]
                self.assertEqual(trigger['branches'], ['main'])
                for path in paths:
                    self.assertTrue(any(fnmatch.fnmatchcase(path, p) for p in trigger['paths']), path)

    def test_manual_publication_remains_available(self):
        self.assertIn('workflow_dispatch', self.pages['on'])

    def test_pr_validation_has_no_deployment_permissions(self):
        self.assertEqual(self.pages['permissions'], {'contents': 'read'})
        permissions = self.pages['jobs']['publish']['permissions']
        self.assertEqual(permissions['pages'], 'write')
        self.assertEqual(permissions['id-token'], 'write')

    def test_workflow_contract_runs_in_ci_and_blocks_publication(self):
        steps = self.pages['jobs']['workflow-contract']['steps']
        runs = '\n'.join(step.get('run', '') for step in steps)
        checkout = next(step for step in steps if step.get('uses', '').startswith('actions/checkout@'))
        self.assertEqual(checkout['with']['fetch-depth'], '0', 'history-preservation checks require the audit baseline commit')
        self.assertIn('PyYAML==6.0.3', runs)
        self.assertIn('python3 -m unittest discover -s scripts/tests', runs)
        self.assertNotIn('continue-on-error', self.pages['jobs']['workflow-contract'])

    def test_v032_direct_checks_cover_pages_changes(self):
        gate = load_workflow('mahalino-v032-quality-gate.yml')
        for event in ('push', 'pull_request'):
            self.assertIn('.github/workflows/pages.yml', gate['on'][event]['paths'])


if __name__ == '__main__':
    unittest.main()
