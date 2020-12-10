import { gunzip } from "zlib"

import {
  USTAR_INDICATOR_FIELD_LENGTH,
  USTART_INDICATOR_OFFSET,
  USTAR_INDICATOR,
  FILENAME_OFFSET,
  FILENAME_FIELD_LENGTH,
  FILESIZE_OFFSET,
  FILESIZE_FIELD_LENGTH,
  FILEMODE_OFFSET,
  FILEMODE_FIELD_LENGTH,
  LINK_INDICATOR_OFFSET,
  LINK_INDICATOR_FIELD_LENGTH,
  LINKED_FILENAME_OFFSET,
  LINKED_FILENAME_FIELD_LENGTH,
  FILENAME_PREFIX_OFFSET,
  FILENAME_PREFIX_FIELD_LENGTH,
  HEADER_SIZE,
} from "./lib/constants.js"
import { extract_ascii } from "./lib/byte_ops.js"

/**
 * @param {Buffer} buffer
 * @param {Number} start_index
 * @param {Object[]} file_entries
 */
function extract_file_entry(buffer, start_index, file_entries) {
  const file_entry = {
    filename: "",
    filemode: 0b0000,
    filesize: 0o0000,
    link_indicator: "\0",
    typeflag: "\0",
    linked_filename: "",
    is_ustar_format: false,
    ustar_version: "00",
    filename_prefix: "",
    contents: Buffer.from(""),
  }

  file_entry.is_ustar_format =
    extract_ascii(
      buffer,
      start_index + USTART_INDICATOR_OFFSET,
      USTAR_INDICATOR_FIELD_LENGTH
    ) === USTAR_INDICATOR

  file_entry.filename = extract_ascii(
    buffer,
    start_index + FILENAME_OFFSET,
    FILENAME_FIELD_LENGTH
  )

  file_entry.filemode = parseInt(buffer.slice(
    start_index + FILEMODE_OFFSET,
    start_index + FILEMODE_OFFSET + FILEMODE_FIELD_LENGTH
  ).toString("ascii"))

  file_entry.filesize = parseInt(buffer.slice(
    start_index + FILESIZE_OFFSET,
    start_index + FILESIZE_OFFSET + FILESIZE_FIELD_LENGTH
  ).toString("ascii"))

  file_entry.link_indicator = extract_ascii(
    buffer,
    start_index + LINK_INDICATOR_OFFSET,
    LINK_INDICATOR_FIELD_LENGTH
  )

  file_entry.linked_filename = extract_ascii(
    buffer,
    start_index + LINKED_FILENAME_OFFSET,
    LINKED_FILENAME_FIELD_LENGTH
  )

  if (file_entry.is_ustar_format) {
    // TODO extract ustar header values
    file_entry.typeflag = file_entry.link_indicator

    file_entry.filename_prefix = extract_ascii(
      buffer,
      start_index + FILENAME_PREFIX_OFFSET,
      FILENAME_PREFIX_FIELD_LENGTH
    )
  }

  file_entry.contents = buffer.slice(
    start_index + HEADER_SIZE,
    start_index + HEADER_SIZE + file_entry.filesize
  )

  // FIXME Fucking tar files are the worst
  // Size is all fucked up
  // The documentation for them is shit
  // Node HATES Buffer data
  // Fuck everything about this shit
  // for (let b = file_entry.contents.byteLength - 1; b >= 0; b--) {
  //   if (file_entry.contents[b] === 0) {
  //     file_entry.contents = file_entry.contents.slice(0, b)
  //   } else {
  //     break
  //   }
  // }

  // file_entry.filesize = file_entry.contents.byteLength

  // console.log(file_entry)
  file_entries.push(file_entry)

  return start_index + HEADER_SIZE + file_entry.filesize
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

  /** @type {Object[]} */
  const file_entries = []

  let last_index = 0

  // TODO Iterate through all the bytes in tar_contents
  // Populate the file_entries map
  // And once done with a given file entry, update the byte_index for the next entry

  while (true) {
    last_index = extract_file_entry(tar_contents, last_index, file_entries)
    while (last_index < tar_buffer.byteLength && tar_contents[last_index] === 0) {
      last_index++
    }
    if (last_index >= tar_buffer.byteLength) break
  }

  console.log("stop here!")
}
