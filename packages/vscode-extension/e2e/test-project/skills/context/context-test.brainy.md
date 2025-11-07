# Context Skill Test

Test the context skill for managing conversation contexts.

@context --action switch --name test-context

@task --prompt "Test message in new context" --debug

@context --action switch --name main
