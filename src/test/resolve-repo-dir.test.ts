import assert from 'node:assert/strict'
import { test, suite, before, after } from 'node:test'
import fs from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

import {
    TEST_REPO_NAME,
    EXAMPLE_REPO,
    TEST_FAKE_REPO,
    setupTestRepo
} from './test-common.ts'
import { resolveRepoDir, cleanup } from '../internal/dir-utils.ts'

const TEST_REPO_DIR = join(tmpdir(), TEST_REPO_NAME)

suite('resolveRepoDir', () => {
    before(async () => await setupTestRepo(TEST_REPO_DIR))

    after(async () => await cleanup(TEST_REPO_DIR))

    test('returns the same path for a valid local git repo', async () => {
        const dir = await resolveRepoDir(TEST_REPO_DIR)
        assert.equal(dir, TEST_REPO_DIR)
    })

    test('throws for a non-existent directory', async () => {
        const tmp = await fs.promises.mkdtemp(join(tmpdir(), TEST_FAKE_REPO))
        await fs.promises.rm(tmp, { recursive: true, force: true })
        // Now `tmp` is a guaranteed non-existent directory path
        await assert.rejects(() => resolveRepoDir(tmp), /does not exist/)
    })

    test('throws for a directory that is not a git repo', async () => {
        const tmp = await fs.promises.mkdtemp(join(tmpdir(), 'not-a-git-'))
        try {
            await assert.rejects(
                () => resolveRepoDir(tmp),
                /is not a Git repository/
            )
        } finally {
            await fs.promises.rm(tmp, { recursive: true, force: true })
        }
    })

    test('can resolve a remote repo URL (clone)', async () => {
        // This will actually clone the repo, so it may take time and require network
        const dir = await resolveRepoDir(EXAMPLE_REPO)
        assert.ok(fs.existsSync(join(dir, '.git')))
        // Clean up the cloned directory
        await fs.promises.rm(dir, { recursive: true, force: true })
    })
})
