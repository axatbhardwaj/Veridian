# Gemini API Schema Guide: Creating and Using Schemas for Response Validation

## Introduction
The Gemini API allows you to enforce structured responses by specifying a `response_schema` in the `generation_config`. This guide explains how to create and use schemas effectively.

## 1. Core Concepts
- **Purpose**: Ensure AI outputs are predictable, typed, and easy to parse
- **Format**: Python types (classes/dataclasses) that shape AI responses
- **Validation**: Implicit during generation - AI tries to match the schema
- **Response Type**: Always JSON (uses `application/json` MIME type)

## 2. Schema Requirements for Gemini API

### Basic Structure
```python
from dataclasses import dataclass
from typing import Optional, List

@dataclass(frozen=True)
class ExampleSchema:
    required_field: str
    optional_field: Optional[str] = None
    list_field: List[str] = None
```

### API Configuration
```python
import google.generativeai as genai

response = model.generate_content(
    "Your prompt",
    generation_config=genai.types.GenerationConfig(
        response_mime_type="application/json",
        response_schema=ExampleSchema
    )
)
```

## 3. Step-by-Step Schema Creation

### Step 1: Define Your Data Structure
1. List all required fields
2. Identify optional fields
3. Determine field types (str, int, bool, list, etc.)
4. Plan any nested structures

### Step 2: Create the Schema Class
```python
@dataclass(frozen=True)
class UserProfile:
    name: str                    # Required
    age: int                     # Required
    bio: Optional[str] = None    # Optional
    tags: List[str] = None       # Optional list
```

### Step 3: Serialize for Transport (If Needed)
```python
import pickle

def build_schema(schema_class, is_list: bool = False):
    return {
        "class": pickle.dumps(schema_class).hex(),
        "is_list": is_list
    }
```

### Step 4: Use in API Call
```python
# Deserialize (if using serialized schema)
schema_class = pickle.loads(bytes.fromhex(schema_dict["class"]))

# Configure API call
config = {
    "response_mime_type": "application/json",
    "response_schema": schema_class  # or list[schema_class] for lists
}

# Make the call
response = model.generate_content(
    prompt,
    generation_config=genai.types.GenerationConfig(**config)
)
```

## 4. Best Practices

### Schema Design
- Keep schemas simple and flat when possible
- Use descriptive field names
- Add type hints for all fields
- Make immutable with `frozen=True`
- Use Optional[] for non-required fields

### Error Handling
```python
try:
    response = model.generate_content(...)
    data = json.loads(response.text)
    # Process data
except Exception as e:
    # Handle specific exceptions at lowest level
    logger.error(f"Schema validation failed: {e}")
```

### Security Considerations
- Only use pickle for internal, trusted data
- Validate all inputs before processing
- Don't expose schema internals to users
- Use secure transport for schema sharing

## 5. Common Patterns

### List Schemas
```python
@dataclass(frozen=True)
class Item:
    id: str
    name: str

# For list responses
response_schema = list[Item]
```

### Nested Schemas
```python
@dataclass(frozen=True)
class Address:
    street: str
    city: str

@dataclass(frozen=True)
class Person:
    name: str
    address: Address
```

### Enum Fields
```python
from enum import Enum

class ActionType(Enum):
    CREATE = "create"
    UPDATE = "update"
    DELETE = "delete"

@dataclass(frozen=True)
class Action:
    type: ActionType
    data: dict
```

## 6. Testing Schemas

### Basic Validation Test
```python
def test_schema_response():
    response = model.generate_content(
        "Create a user profile",
        generation_config=genai.types.GenerationConfig(
            response_mime_type="application/json",
            response_schema=UserProfile
        )
    )
    
    data = json.loads(response.text)
    assert "name" in data
    assert "age" in data
    assert isinstance(data["age"], int)
```

## 7. Troubleshooting

### Common Issues
1. **Missing Fields**: AI ignores schema requirements
   - Solution: Add explicit field requirements in prompt
   
2. **Type Mismatches**: AI returns wrong types
   - Solution: Add type constraints in prompt
   
3. **Invalid JSON**: AI generates malformed responses
   - Solution: Use try-except for parsing
   
4. **Schema Too Complex**: AI struggles with deep nesting
   - Solution: Simplify schema, break into smaller parts

## 8. Resources
- [Google Generative AI Documentation](https://ai.google.dev/)
- [Python dataclasses Documentation](https://docs.python.org/3/library/dataclasses.html)
- [JSON Schema Specification](https://json-schema.org/)

## 9. Examples from Real Use Cases

### Twitter Action Schema
```python
@dataclass(frozen=True)
class TwitterAction:
    action: str
    text: str
    user_id: Optional[str] = None
```

### Token Action Schema
```python
@dataclass(frozen=True)
class TokenAction:
    action_name: str
    amount: Optional[int] = None
    token_id: Optional[str] = None
```

Remember: The goal is to make schemas that are:
- Simple to understand
- Easy to maintain
- Reliable for validation
- Secure in implementation 