package ai.typerefinery.websight.utils;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;

public class JsonUtil {
 
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
        } catch (JsonProcessingException e) {
            e.getMessage();
        }
        return jsonString;
    }

}
