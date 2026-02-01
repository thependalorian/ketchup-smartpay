# Knowledge Base Documentation

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Content Policies](#content-policies)
4. [Ingestion Process](#ingestion-process)
5. [Search Capabilities](#search-capabilities)
6. [Content Categories](#content-categories)
7. [Best Practices](#best-practices)
8. [Maintenance & Updates](#maintenance--updates)

---

## Overview

The Buffr Knowledge Base is a RAG (Retrieval-Augmented Generation) system that powers AI-assisted customer support. It combines vector search, knowledge graph traversal, and semantic chunking to provide accurate, context-aware responses to customer queries.

### Key Features

- **Semantic Search**: Find relevant information using vector embeddings
- **Knowledge Graph**: Explore relationships between concepts and entities
- **Hybrid Search**: Combines vector and graph search for comprehensive results
- **Multi-format Support**: Processes Markdown, text files, and structured documents
- **Entity Extraction**: Automatically identifies companies, technologies, and people
- **Source Attribution**: Always cites sources for transparency

### Use Cases

- Customer support queries
- FAQ responses
- Feature documentation
- Policy explanations
- Troubleshooting guides
- Product information

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Knowledge Base System                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐      ┌──────────────┐      ┌───────────┐ │
│  │   Document   │──────▶│   Chunker    │──────▶│ Embedder  │ │
│  │   Ingestion  │       │  (Semantic)  │      │ (Vector)  │ │
│  └──────────────┘       └──────────────┘      └───────────┘ │
│         │                       │                   │        │
│         │                       │                   │        │
│         ▼                       ▼                   ▼        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         PostgreSQL (pgvector)                        │  │
│  │  - documents table (metadata)                         │  │
│  │  - chunks table (content + embeddings)                │  │
│  │  - messages table (conversation history)              │  │
│  └──────────────────────────────────────────────────────┘  │
│         │                                                    │
│         │                                                   │
│         ▼                                                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Neo4j Knowledge Graph                  │  │
│  │  - Entities (companies, technologies, people)         │  │
│  │  - Relationships (connections, dependencies)          │  │
│  │  - Episodes (temporal facts)                          │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Search & Retrieval                      │  │
│  │  - Vector Search (semantic similarity)                │  │
│  │  - Graph Search (relationship traversal)              │  │
│  │  - Hybrid Search (combined approach)                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Companion Agent Integration                  │  │
│  │  - search_knowledge_base tool                        │  │
│  │  - Automatic source citation                         │  │
│  │  - Context-aware responses                           │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Ingestion**: Documents → Chunking → Embedding → Storage
2. **Query**: User Question → Embedding → Vector/Graph Search → Results
3. **Response**: Search Results → Context Building → LLM Generation → Answer

### Technology Stack

- **Database**: PostgreSQL with `pgvector` extension
- **Graph Database**: Neo4j
- **Embedding Model**: Configurable (OpenAI, Cohere, local models)
- **Chunking**: Semantic chunking with configurable overlap
- **Search**: Hybrid search combining vector similarity and graph traversal

---

## Content Policies

### ✅ Allowed Content

The knowledge base should contain:

1. **Public Documentation**
   - User guides and tutorials
   - Feature documentation
   - API references (public endpoints)
   - General product information
   - FAQ content

2. **Support Materials**
   - Troubleshooting guides
   - Common error messages and solutions
   - Step-by-step procedures
   - Best practices
   - Configuration guides

3. **Compliance & Legal**
   - Public terms of service
   - Privacy policy summaries
   - Regulatory compliance information (public-facing)
   - Security best practices (general)

4. **Educational Content**
   - How-to articles
   - Conceptual explanations
   - Industry standards (public)
   - General financial/payment concepts

### ❌ Prohibited Content

**DO NOT** include in the knowledge base:

1. **Sensitive Information**
   - API keys, secrets, or credentials
   - Database connection strings
   - Authentication tokens
   - Private encryption keys
   - Internal system passwords

2. **Business Strategy**
   - Competitive positioning details
   - Pricing strategies
   - Market expansion plans
   - Partnership negotiations
   - Revenue models or financial projections

3. **Internal Operations**
   - Internal team structures
   - Employee information
   - Internal processes (non-public)
   - Vendor relationships (confidential)
   - Internal metrics or KPIs

4. **Customer Data**
   - Personal identifiable information (PII)
   - Transaction details
   - Account numbers
   - Payment information
   - User-specific data

5. **Proprietary Code**
   - Source code (unless public/open source)
   - Algorithm implementations
   - Internal tooling details
   - System architecture specifics (if sensitive)

### Content Review Process

Before adding content to the knowledge base:

1. **Review for Sensitive Information**
   - Check for API keys, secrets, credentials
   - Verify no business strategy details
   - Ensure no customer data

2. **Verify Accuracy**
   - Content must be accurate and up-to-date
   - Cross-reference with official documentation
   - Check for outdated information

3. **Check Relevance**
   - Content should be useful for customer support
   - Align with common customer queries
   - Support AI agent's capabilities

4. **Format Validation**
   - Proper Markdown formatting
   - Clear structure and headings
   - Readable and well-organized

### Content Formatting Standards

- **File Format**: Markdown (`.md`) or plain text (`.txt`)
- **Encoding**: UTF-8
- **Structure**: Use clear headings (`#`, `##`, `###`)
- **Metadata**: Optional YAML frontmatter for categorization
- **Links**: Use relative paths for internal references
- **Code Blocks**: Use syntax highlighting when applicable

---

## Ingestion Process

### Overview

The ingestion pipeline processes documents through several stages:

1. **Document Discovery**: Finds all markdown/text files
2. **Chunking**: Splits documents into semantic chunks
3. **Embedding**: Generates vector embeddings for each chunk
4. **Storage**: Saves to PostgreSQL with metadata
5. **Graph Building**: Extracts entities and relationships (optional)

### Running Ingestion

#### Basic Usage

```bash
# From buffr_ai directory
cd buffr_ai

# Run ingestion with default settings
python -m ingestion.ingest

# Specify documents folder
python -m ingestion.ingest --documents /path/to/documents

# Clean existing data before ingestion
python -m ingestion.ingest --clean

# Fast mode (skip knowledge graph building)
python -m ingestion.ingest --fast
```

#### Advanced Options

```bash
# Custom chunk size and overlap
python -m ingestion.ingest --chunk-size 1500 --chunk-overlap 300

# Disable semantic chunking (use simple text splitting)
python -m ingestion.ingest --no-semantic

# Disable entity extraction
python -m ingestion.ingest --no-entities

# Verbose logging
python -m ingestion.ingest --verbose
```

### Configuration

Ingestion behavior is controlled by:

1. **Environment Variables** (`.env.local`):
   - `DATABASE_URL`: PostgreSQL connection string
   - `NEO4J_URI`: Neo4j connection URI
   - `NEO4J_USER`: Neo4j username
   - `NEO4J_PASSWORD`: Neo4j password
   - `EMBEDDING_PROVIDER`: `openai`, `cohere`, or `local`
   - `EMBEDDING_MODEL`: Model name (e.g., `text-embedding-3-small`)

2. **Command-Line Arguments**:
   - `--chunk-size`: Size of each chunk (default: 1000 tokens)
   - `--chunk-overlap`: Overlap between chunks (default: 200 tokens)
   - `--documents`: Path to documents folder (default: `documents/`)
   - `--clean`: Remove existing data before ingestion
   - `--fast`: Skip knowledge graph building
   - `--no-semantic`: Disable semantic chunking
   - `--no-entities`: Disable entity extraction

### Chunking Strategy

#### Semantic Chunking (Default)

- Uses embedding similarity to split at natural boundaries
- Preserves context across chunk boundaries
- Better for maintaining meaning in chunks
- Recommended for most documents

#### Simple Text Splitting

- Fixed-size chunks with overlap
- Faster processing
- Less context preservation
- Use for structured documents

### Entity Extraction

When enabled, the system extracts:

- **Companies**: Organizations mentioned in documents
- **Technologies**: Tools, frameworks, platforms
- **People**: Individuals referenced

These entities are:
- Stored in chunk metadata
- Added to Neo4j knowledge graph
- Used for relationship discovery

### Processing Time

Typical processing times:

- **Small document** (< 10KB): 5-10 seconds
- **Medium document** (10-100KB): 30-60 seconds
- **Large document** (> 100KB): 2-5 minutes
- **With graph building**: Add 1-3 minutes per document

### Error Handling

The ingestion process:

- Continues processing if one document fails
- Logs errors for each failed document
- Provides summary of successes and failures
- Returns detailed results for each document

---

## Search Capabilities

### Search Types

The knowledge base supports three search methods:

#### 1. Vector Search

**How it works:**
- Converts query to embedding vector
- Finds chunks with similar embeddings
- Returns results ranked by similarity score

**Best for:**
- Semantic similarity queries
- Finding conceptually related content
- "What is..." or "How does..." questions

**Example:**
```python
# Query: "How do I reset my password?"
# Finds: Documents about password management, account recovery, etc.
```

#### 2. Graph Search

**How it works:**
- Traverses Neo4j knowledge graph
- Follows relationships between entities
- Returns connected information

**Best for:**
- Relationship queries
- "What's related to..." questions
- Finding connections between concepts

**Example:**
```python
# Query: "What features are related to payments?"
# Finds: Payment-related entities and their connections
```

#### 3. Hybrid Search

**How it works:**
- Combines vector and graph search
- Merges results with intelligent ranking
- Provides comprehensive coverage

**Best for:**
- Complex queries
- When both semantic and relational info needed
- General customer support questions

**Example:**
```python
# Query: "How do G2P vouchers work?"
# Finds: 
# - Vector: Documents explaining G2P vouchers
# - Graph: Related concepts (payments, beneficiaries, etc.)
```

### Search Configuration

#### Default Settings

- **Limit**: 3-5 results per search
- **Score Threshold**: 0.7 (for vector search)
- **Text Weight**: 0.3 (for hybrid search)
- **Vector Weight**: 0.7 (for hybrid search)

#### Customization

Search behavior can be adjusted via:

1. **Tool Parameters**:
   ```python
   search_knowledge_base(
       query="user question",
       max_results=5  # Adjust result count
   )
   ```

2. **Search Strategy**:
   - Use hybrid search for best results
   - Fallback to vector if hybrid fails
   - Use graph for relationship queries

### Result Format

Search results include:

```python
{
    "content": "Relevant text chunk",
    "document_title": "Source document name",
    "document_source": "File path or identifier",
    "score": 0.85,  # Similarity score (0-1)
    "metadata": {
        "chunk_index": 5,
        "entities": {...},
        "ingestion_date": "2024-01-15"
    }
}
```

### Source Attribution

All search results include:

- **Document Title**: Name of source document
- **Document Source**: File path or identifier
- **Chunk Index**: Position in original document
- **Score**: Relevance confidence (0-1)

This ensures transparency and allows users to verify information.

---

## Content Categories

### Recommended Structure

Organize knowledge base content into categories:

```
documents/
├── user-guides/
│   ├── getting-started.md
│   ├── account-setup.md
│   └── profile-management.md
├── features/
│   ├── payments.md
│   ├── vouchers.md
│   └── transactions.md
├── troubleshooting/
│   ├── common-issues.md
│   ├── error-messages.md
│   └── faq.md
├── policies/
│   ├── terms-of-service.md
│   ├── privacy-policy.md
│   └── security.md
└── api/
    ├── authentication.md
    ├── endpoints.md
    └── examples.md
```

### Category Guidelines

#### User Guides
- Step-by-step instructions
- Clear, beginner-friendly language
- Screenshots or examples when helpful
- Common use cases

#### Features
- Feature descriptions
- Use cases and benefits
- Configuration options
- Limitations or constraints

#### Troubleshooting
- Common problems and solutions
- Error message explanations
- Diagnostic steps
- Escalation paths

#### Policies
- Terms of service summaries
- Privacy policy highlights
- Security best practices
- Compliance information

#### API Documentation
- Endpoint descriptions
- Authentication methods
- Request/response formats
- Code examples

### Content Examples

#### Good Content

```markdown
# How to Reset Your Password

If you've forgotten your password, follow these steps:

1. Open the Buffr app
2. Tap "Forgot Password" on the login screen
3. Enter your registered phone number
4. Check your SMS for the verification code
5. Enter the code and create a new password

**Note**: The verification code expires in 10 minutes.

**Still having issues?** Contact support for assistance.
```

#### Poor Content

```markdown
# Password Reset

Use the forgot password feature. Enter your phone number. Get a code. Enter it. Done.
```

**Why it's poor:**
- Too brief
- No clear steps
- Missing important details
- No escalation path

---

## Best Practices

### Writing for RAG

1. **Be Specific**
   - Use clear, descriptive headings
   - Include relevant keywords
   - Avoid ambiguous language

2. **Structure Clearly**
   - Use proper heading hierarchy
   - Break content into sections
   - Use lists for steps or features

3. **Provide Context**
   - Explain concepts before using them
   - Include examples when helpful
   - Link related topics

4. **Keep It Current**
   - Update outdated information
   - Remove deprecated content
   - Add new features promptly

### Chunking Considerations

1. **Natural Boundaries**
   - Split at section breaks
   - Preserve context within chunks
   - Maintain logical flow

2. **Appropriate Size**
   - 500-1500 tokens per chunk (optimal)
   - Too small: Loses context
   - Too large: Harder to match precisely

3. **Overlap Strategy**
   - 10-20% overlap between chunks
   - Ensures context continuity
   - Helps with boundary cases

### Search Optimization

1. **Use Descriptive Titles**
   - Clear, keyword-rich titles
   - Help with initial matching
   - Improve user understanding

2. **Include Synonyms**
   - Use alternative terms
   - Cover different phrasings
   - Account for user language variations

3. **Structure for Discovery**
   - FAQ format for common questions
   - Problem-solution format for troubleshooting
   - Step-by-step for procedures

### Maintenance

1. **Regular Updates**
   - Review content quarterly
   - Update for new features
   - Remove outdated information

2. **Monitor Search Quality**
   - Track common queries
   - Identify gaps in content
   - Improve based on feedback

3. **Version Control**
   - Track changes to documents
   - Maintain history
   - Enable rollback if needed

---

## Maintenance & Updates

### Adding New Content

1. **Prepare Document**
   - Write in Markdown format
   - Follow content policies
   - Review for accuracy

2. **Place in Documents Folder**
   - Use appropriate category folder
   - Follow naming conventions
   - Ensure proper encoding

3. **Run Ingestion**
   ```bash
   python -m ingestion.ingest --documents /path/to/new/content
   ```

4. **Verify Results**
   - Check ingestion logs
   - Test search queries
   - Verify source attribution

### Updating Existing Content

1. **Edit Source Document**
   - Make changes in Markdown file
   - Update metadata if needed
   - Review for consistency

2. **Re-ingest Document**
   ```bash
   # Clean and re-ingest specific document
   python -m ingestion.ingest --clean
   # Or re-ingest entire folder
   python -m ingestion.ingest
   ```

3. **Test Changes**
   - Search for updated content
   - Verify new information appears
   - Check for broken references

### Removing Content

1. **Delete Source File**
   - Remove from documents folder
   - Update any references

2. **Clean Database** (if needed)
   ```sql
   -- Remove specific document
   DELETE FROM chunks WHERE document_id = '...';
   DELETE FROM documents WHERE id = '...';
   ```

3. **Re-run Ingestion**
   - Ensures database consistency
   - Updates search indexes
   - Cleans up orphaned data

### Monitoring

#### Key Metrics

- **Ingestion Success Rate**: % of documents processed successfully
- **Search Quality**: Relevance scores and user feedback
- **Content Coverage**: Gaps in common query topics
- **Update Frequency**: How often content is refreshed

#### Health Checks

1. **Database Connectivity**
   - PostgreSQL accessible
   - Neo4j accessible
   - Connection pools healthy

2. **Search Performance**
   - Query response times
   - Result relevance
   - Error rates

3. **Content Freshness**
   - Last update dates
   - Outdated content flags
   - Missing information alerts

### Troubleshooting

#### Common Issues

1. **Low Search Relevance**
   - **Cause**: Poor chunking or outdated content
   - **Fix**: Adjust chunk size, update content

2. **Missing Results**
   - **Cause**: Content not ingested or wrong category
   - **Fix**: Verify ingestion, check document location

3. **Slow Search**
   - **Cause**: Large database or inefficient queries
   - **Fix**: Optimize indexes, reduce result limits

4. **Ingestion Failures**
   - **Cause**: Database connection or format issues
   - **Fix**: Check credentials, validate document format

---

## Appendix

### Environment Variables Reference

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:port/dbname
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password

# Embedding Provider
EMBEDDING_PROVIDER=openai  # or cohere, local
EMBEDDING_MODEL=text-embedding-3-small
OPENAI_API_KEY=sk-...
COHERE_API_KEY=...

# Ingestion Settings (optional)
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
```

### File Structure Example

```
buffr_ai/
├── ingestion/
│   ├── ingest.py          # Main ingestion script
│   ├── chunker.py          # Chunking logic
│   ├── embedder.py         # Embedding generation
│   └── graph_builder.py    # Knowledge graph builder
├── documents/              # Source documents folder
│   ├── user-guides/
│   ├── features/
│   ├── troubleshooting/
│   └── policies/
└── agent/
    └── tools.py            # Search tools for agents
```

### Command Reference

```bash
# Basic ingestion
python -m ingestion.ingest

# With options
python -m ingestion.ingest \
  --documents ./documents \
  --chunk-size 1500 \
  --chunk-overlap 300 \
  --clean \
  --verbose

# Fast mode (skip graph)
python -m ingestion.ingest --fast

# Help
python -m ingestion.ingest --help
```

---

## Summary

The Buffr Knowledge Base is a powerful RAG system that enables intelligent customer support through semantic search and knowledge graph traversal. By following these guidelines:

- ✅ Maintain accurate, up-to-date content
- ✅ Follow content policies (no secrets, no strategy)
- ✅ Structure content for optimal search
- ✅ Regularly update and maintain
- ✅ Monitor search quality and performance

You can ensure the knowledge base provides accurate, helpful responses to customer queries while maintaining security and confidentiality.

---

**Last Updated**: 2025-01-26  
**Version**: 1.0  
**Maintainer**: Buffr AI Team
