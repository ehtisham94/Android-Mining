#!/bin/bash

echo "start"
echo "Raw DATA: $DATA"

# Parse JSON using jq
name=$(echo "$DATA" | jq -r '.name')
group=$(echo "$DATA" | jq -r '.group')
slot=$(echo "$DATA" | jq -r '.slot')

# Display the parsed values
echo "Parsed DATA:"
echo "Key1: $name"
echo "Key2: $group"
echo "Key3: $slot"

# Input variable
# name="s8_001"

# Extract the model key from the `name` variable (assuming the pattern before "_" is the key)
model_key=$(echo "$name" | cut -d'_' -f1)

# Declare a mapping
declare -A model_map=(
    ["stylo5"]="a53"
    ["s8"]="a73-a53"
    ["v30"]="a73-a53"
    ["v35"]="a75-a55"
    ["v40"]="a75-a55"
    ["v50"]="a76-a55"
    ["g8"]="a76-a55"
    ["g8x"]="a76-a55"
    ["velvet"]="a76-a55"
)

# Get the mapped value
mapped_value=${model_map[$model_key]}

# Print or use the new variable
echo "name: $name"
echo "Model Key: $model_key"
echo "Mapped Value: $mapped_value"

echo "end"
