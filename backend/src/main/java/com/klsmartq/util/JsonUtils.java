package com.klsmartq.util;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.Collections;
import java.util.List;

public final class JsonUtils {

    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final TypeReference<List<String>> STRING_LIST_TYPE = new TypeReference<>() {};

    private JsonUtils() {
    }

    public static String writeStringList(List<String> values) {
        if (values == null || values.isEmpty()) {
            return null;
        }
        List<String> trimmed = values.stream()
            .filter(item -> item != null && !item.isBlank())
            .map(String::trim)
            .toList();
        if (trimmed.isEmpty()) {
            return null;
        }
        try {
            return MAPPER.writeValueAsString(trimmed);
        } catch (JsonProcessingException ex) {
            throw new IllegalArgumentException("Failed to serialize office assignments", ex);
        }
    }

    public static List<String> readStringList(String json) {
        if (json == null || json.isBlank()) {
            return Collections.emptyList();
        }
        try {
            return MAPPER.readValue(json, STRING_LIST_TYPE);
        } catch (Exception ex) {
            return Collections.emptyList();
        }
    }
}
