# File Skill Test

Test the file skill for file operations.

@file --action write --path test-output.txt --content "Test content from file skill"

@file --action read --path test-output.txt --variable fileContent

@file --action delete --path test-output.txt
