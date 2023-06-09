# aws-doc-extractor

This project pulls in AWS documentation and extracts, consolidates, and organizes all admonitions. 

It is used to generate the content for [AWS Reference Notes](https://awsnotes.dendron.so/about/readme)

<figure><img src="https://ik.imagekit.io/fpjzhqpv1/spaces_f3gLJIDBWU1gy8axhkzg_uploads_git-blob-b831b3fe7db725905e1d8a7ac9aee460a0194025_cloud-ref-notes_yulnDmgj_.webp?updatedAt=1684507323528" alt="Cloud Reference Notes", height="400px" </figure>

AWS Reference Notes is a compilation of the **Note-able** sections of AWS services[^1].

It is compiled by parsing all sections of [AWS Documentation](https://docs.aws.amazon.com/) and extracting specific admonitions (eg. **Note**, **Important**, **Considerations**) which are then organized and compiled here. 

AWS Reference Notes exists because I observed that any section of the AWS docs that start with a **Note** was something that was worth paying attention to. These sections documented gotchas, limits, and other caveats of a particular service. When not observed, they can take anywhere on the order of hours to weeks to work around. 

[^1]: NOTE: AWS Reference Notes currently has 66 services respresented

## Getting Started

1. Clone the repo
    ```sh
    git clone https://github.com/kevinslin/aws-doc-extractor.git
    ```
2. Install dependencies
    ```
    cd aws-doc-extractor
    yarn 
    ```
3. Compile typescript
    ```sh
    yarn watch
    ```

4. Generate docs (optional)
    ```sh
    yarn gen:all
    ```

> NOTE: currently, the default is to write the docs in [dendron flavored markdown](https://wiki.dendron.so/)

### Advanced Instructions

These instructions go over generating content to update [AWS Reference Notes](https://awsnotes.dendron.so/about/readme)

1. Create a dependencies folder
    ```sh
    mkdir dependencies && cd dependencies
    git clone https://github.com/dendronhq/dendron-api-v2
    git clone https://github.com/kevinslin/aws-reference-notes
    ```
1. Run the api server
    ```sh
    cd dendron-api-v2
    yarn
    yarn dev
    ```
1. Sync the docs
    ```sh
    # $ROOT is where the package.json of aws-doc-extractor is
    cd $ROOT
    curl --location 'localhost:8080/sync/to' \
    --header 'Content-Type: application/json' \
    --data '{
        "src": "$ROOT/build/artifacts",
        "dest": "$ROOT/dependencies/aws-reference-notes/services",
        "targetFormat": "markdown",
        "include": "hierarchies=*",
        "exclude": "hierarchies=ignore.*",
        "deleteMissing": true
    }'
    ```

## Lifecycle

The following describes how the docs are extracted in pseudocode

### main
- services.forEach
    - `upsertDevGuide`: clone aws repo or pull
    - `upsertToc`: fetch table of contents for particular service
- services.forEach
    - `extractNotesFromService`: extract **Note** sections for each service
- `generateSiteToc`: generate a global table of contents for all services

### extractNotesFromService
- `processMarkdownFiles`: extract **Note** sections from aws docs
- `combineTocAndNotes`: merge extracted sections with aws table of contents
- `renderFromJSON(renderTargetFormat)`: write sections into target format
    - `filterSectionWithContent`: exclude all docs that don't have **Note** sections
    - `section2VFiles`: convert sections to virtual files 
    - `new {renderTargetFormat}.write`: write output to given target formater

## Layout

This describes the file layout of the project

### doc layout

```
- build/
    - artifacts/
        - {service}/
            - {target}/
        - SUMMARY.md
    - staging/
        - {service}/
- docs/
    - /{service}/
        - developer-guide/
        - toc.json
```

- build: contains the extracted notes
    - staging: intermediary files created when extracting notes
    - {service}: specific AWS service
        - {target}: target format (eg. markdown, html, etc)
    - SUMMARY.md: table of contents for all services
- docs: aws upstream doc repos
    - {service}:
        - developer-guide: doc repo for particular aws service
        - toc.json: the table of contents for a particular aws service

## Known Issues

1. Jest tests don't work. Converted the package to es modules which has caused jest to fail. 
2. HTML target does not work. Made some refactoring to how targets work. Have not had a chance to update the HTML target spec
