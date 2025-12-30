# Pre-commit Hook Setup

To prevent duplicate manufacturers from being committed, you can set up a pre-commit hook.

## Option 1: Manual Git Hook

Create a file at `.git/hooks/pre-commit`:

```bash
#!/bin/bash
# Pre-commit hook to check for duplicate manufacturers

cd tech-support-directory
node scripts/check-duplicates.ts

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Pre-commit check failed!"
    echo "   Fix the issues above before committing."
    exit 1
fi

exit 0
```

Make it executable:

```bash
chmod +x .git/hooks/pre-commit
```

## Option 2: Using pre-commit framework

If you use the [pre-commit](https://pre-commit.com/) framework, add this to `.pre-commit-config.yaml`:

```yaml
repos:
  - repo: local
    hooks:
      - id: check-manufacturer-duplicates
        name: Check for duplicate manufacturers
        entry: bash -c 'cd tech-support-directory && node scripts/check-duplicates.ts'
        language: system
        pass_filenames: false
        files: 'tech-support-directory/data/manufacturers/.*\.yaml$'
```

Then run:

```bash
pre-commit install
```

## Manual Check

You can also run the check manually at any time:

```bash
cd tech-support-directory
node scripts/check-duplicates.ts
```

If duplicates are found, run the deduplication script:

```bash
node scripts/dedupe-manufacturers.ts --apply
```
