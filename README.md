# Unarchiver

Extract tar.gz (and others in the future) files into target directories.

Note that this is not feature-complete and is not intended to encompass every possible scenario for compressed tar files.

Submissions are welcome to add new features.

## Notes on feature-complete-ness

I understand this is not the most elaborate and robust `tar` extractor package.

It handles the most simple case (finding actual file-type files in an archive and extracting them).

Beyond the very simple use cases there are plenty of existing packages that do a much more thorough job.

## So why make this one?

This one extracts a sample tar.gz file I need to extract and does it less than 1 ms.

And I understand the code base. Other existing packages have a huge dependency tree, are abandonware, or worse.

# What this _does_ cover

Currently there is exposed an API for:

- `gunzip_unarchive(tar_stream, target_path)`: this will decompress and then extract a `*.tar.gz` stream
  - `tar_stream` is a readable stream buffer of the `*.tar.gz` file you want to extract
  - `target_path` is the path desired to extract the `tar_stream` into

# What this does _not_ cover

- There are no plans to handle `sparse` tar files

- File permissions, atimes, permissions are not preserved

- Persisting file linking
