import { strict as assert } from "assert"
import { readFileSync } from "fs"

import { gunzip_unarchive } from "../unarchive.js"

export const id = "Unarchive TAR Files"

const test_tar_file_path = "test-data/inputs/test.tar.gz"
const test_output_path = "test-data/outputs"

export const assertions = {
  "Should be able to extract tar stream to a file directory": {
    function: () => {
      assert.doesNotReject(() =>
        gunzip_unarchive(readFileSync(test_tar_file_path), test_output_path)
      )
    },
    skip: false,
  },
}
