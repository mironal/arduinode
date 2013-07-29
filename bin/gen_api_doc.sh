#!/bin/zsh

BIN_DIR=`dirname $_`/bin
GEN_DOC_JS=$BIN_DIR/gen_api_doc.js
ROOT_DIR=`dirname $BIN_DIR`

node $GEN_DOC_JS $ROOT_DIR/arduinode.js > $ROOT_DIR/doc/API.md

