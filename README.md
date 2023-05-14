# AWS Reference Notes

This extracts all **Note** sections from AWS Developer Docs. 

It is used to generate the content for [AWS Reference Notes](https://awsnotes.dendron.so/about/readme)


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

## Layout

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
