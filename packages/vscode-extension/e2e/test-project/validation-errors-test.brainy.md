# Validation Errors Test

This playbook contains intentional errors to test validation.

## Invalid syntax with trailing characters

@model "gpt-4" extra

This should be flagged as an error.

## Another invalid case

@context "test" trailing text here

## Valid annotation for comparison

@model --id "gpt-4o"

@context --name "valid"
