package ai.typerefinery.websight.utils;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class JsonUtil {

    private static final Logger LOGGER = LoggerFactory.getLogger(JsonUtil.class);

    /**
     * Returns a JSON string representation of the given object.
     */
    public static String getJsonString(Object source) {
        ObjectMapper mapper = new ObjectMapper().configure(SerializationFeature.FAIL_ON_EMPTY_BEANS, false);
        mapper.setSerializationInclusion(JsonInclude.Include.NON_NULL);
        mapper.setSerializationInclusion(JsonInclude.Include.NON_EMPTY);
        String jsonString =null;
        try {
            JsonNode node = mapper.valueToTree(source);
            jsonString = mapper.writeValueAsString(node);
        } catch (JsonProcessingException | IllegalArgumentException e) {
            // valueToTree wraps getter failures in IllegalArgumentException; swallowing it
            // silently made a component's whole data-model disappear with no trace.
            LOGGER.warn("getJsonString failed for {}: {}",
                source == null ? "null" : source.getClass().getName(), e.toString());
        }
        return jsonString;
    }

}
