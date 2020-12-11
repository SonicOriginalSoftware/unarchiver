import { gunzip } from "zlib"
import { dirname, join } from "path"
import { mkdir, writeFile } from "fs/promises"

import {
  FILENAME_OFFSET,
  FILENAME_FIELD_LENGTH,
  FILESIZE_OFFSET,
  FILESIZE_FIELD_LENGTH,
  FILEMODE_OFFSET,
  FILEMODE_FIELD_LENGTH,
  LINK_INDICATOR_OFFSET,
  LINK_INDICATOR_FIELD_LENGTH,
  HEADER_SIZE,
} from "./lib/constants.js"
import { extract_ascii } from "./lib/byte_ops.js"

/** @typedef {{"name": String, "mode": Number, "size": Number, "type": String, "contents": Buffer}} FileEntry */

/**
 * @param {String} file_path
 * @param {Buffer} contents
 */
async function extract_file(file_path, contents) {
  const file_dir = dirname(file_path)
  await mkdir(file_dir, { recursive: true })
  await writeFile(file_path, contents)
}

/**
 * @param {FileEntry[]} file_entries
 * @param {String} target_directory
 */
async function extract_file_entries(file_entries, target_directory) {
  /** @type {Promise<void>[]} */
  const write_promises = []
  for (const each_entry of file_entries) {
    write_promises.push(
      new Promise(async (resolve, reject) => {
        try {
          await extract_file(
            join(target_directory, each_entry.name),
            each_entry.contents
          )
        } catch (error) {
          reject(error)
          return
        }
        resolve()
      })
    )
  }
  return Promise.all(write_promises)
}

/**
 * @param {Buffer} buffer
 * @param {Number} start_index
 * @param {FileEntry[]} file_entries
 */
function extract_file_entry(buffer, start_index, file_entries) {
  /** @type {FileEntry} */
  const file_entry = {
    name: "",
    mode: 0b0000,
    size: 0o0000,
    type: "\0",
    contents: Buffer.from(""),
  }

  file_entry.name = extract_ascii(
    buffer,
    start_index + FILENAME_OFFSET,
    FILENAME_FIELD_LENGTH
  )

  file_entry.mode = parseInt(
    buffer
      .slice(
        start_index + FILEMODE_OFFSET,
        start_index + FILEMODE_OFFSET + FILEMODE_FIELD_LENGTH
      )
      .toString("ascii")
  )

  file_entry.type = extract_ascii(
    buffer,
    start_index + LINK_INDICATOR_OFFSET,
    LINK_INDICATOR_FIELD_LENGTH
  )

  file_entry.size = parseInt(
    buffer.toString(
      "ascii",
      start_index + FILESIZE_OFFSET,
      start_index + FILESIZE_OFFSET + FILESIZE_FIELD_LENGTH
    )
  )

  // Tar blows ass and the implementations can't package their sizes right
  // Instead, we are forced to iterate through the buffer starting at the
  // start_index + HEADER_SIZE until reaching a null character
  // and build the contents up that way
  if (file_entry.type === "0" || file_entry.type === "\0") {
    let content_index = start_index + HEADER_SIZE
    let initial_index = content_index
    while (true) {
      const new_char = buffer[content_index++]
      if (new_char === 0) break
      const append_buffer = Buffer.from([new_char])
      file_entry.contents = Buffer.concat([file_entry.contents, append_buffer])
    }

    file_entry.size = content_index - initial_index - 1
    file_entries.push(file_entry)
  }

  return start_index + HEADER_SIZE + file_entry.size
}

/**
 * Extract a tar file into a directory
 *
 * @param {Buffer} tar_buffer
 * @param {String} target_directory
 */
export async function gunzip_unarchive(tar_buffer, target_directory) {
  /** @type {Buffer} */
  const tar_contents = await new Promise((resolve, reject) =>
    gunzip(tar_buffer, (err, buffer) => (err ? reject(err) : resolve(buffer)))
  )

  /** @type {FileEntry[]} */
  const file_entries = []

  let current_byte = 0

  while (true) {
    current_byte = extract_file_entry(tar_contents, current_byte, file_entries)

    // Need to roll through all the stupid filled data that tar has
    while (
      current_byte < tar_contents.byteLength &&
      tar_contents[current_byte] === 0
    ) {
      current_byte++
    }

    if (current_byte >= tar_contents.byteLength) break
  }

  return extract_file_entries(file_entries, target_directory)
}
