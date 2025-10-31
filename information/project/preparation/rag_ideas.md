- less context works better
- context in the middle gets less important

Concept

Internal Workflows (advanced; local LLM learning)
- SystemGather: System gathers relevant resources, cleans them (summarizes if needed, validates and removes irrelevant content) and saves it
 - Gather URLs
 - Fetch content with scraping
 - Clean content (summarize, validate, remove irrelevant content); Can be done in the iterations if needed
   - All references to online resources have to be preserved
 - Save cleaned content onto file system
- SystemIndex: Chunks all the new data and indexes it for retrieval
- SystemLearn: Focus has to be provided, system will retrieve relevant chunks, reason, refine in iterations and produce a summary document

MCP endpoints
- GetReferences: Summary and IDs of the full chunks available on the topic
- Recall: LLM decides which chunks to recall based on the references; returns concatenated chunks
- SetFeedback: LLM provides feedback on which chunks were relevant
- Save: Saves and indexes the new content (checksum to avoid duplicates, or redundant indexing)

GH Copilot Workflows
- "GetReferences" on the topic (topic is provided by the user)
- "Recall" relevant chunks based on user context
- Respond to user based on recalled chunks
- "SetFeedback" on which chunks were relevant
