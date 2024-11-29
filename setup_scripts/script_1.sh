#!/bin/bash

echo "start"
echo "Raw OBJECT: $OBJECT"

# Parse JSON manually using Bash tools (grep, sed, etc.)
key1=$(echo $OBJECT | grep -o '"key1":"[^"]*"' | sed 's/"key1":"\(.*\)"/\1/')
key2=$(echo $OBJECT | grep -o '"key2":"[^"]*"' | sed 's/"key2":"\(.*\)"/\1/')
key3=$(echo $OBJECT | grep -o '"key3":[^,}]*' | sed 's/"key3":\(.*\)/\1/')

# Display the parsed values
echo "Parsed OBJECT:"
echo "Key1: $key1"
echo "Key2: $key2"
echo "Key3: $key3"

echo "end"
