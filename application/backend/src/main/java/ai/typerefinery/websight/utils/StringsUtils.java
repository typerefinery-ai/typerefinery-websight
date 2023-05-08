package ai.typerefinery.websight.utils;

import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import org.jetbrains.annotations.Nullable;
import org.jetbrains.annotations.NotNull;

import org.apache.commons.lang3.StringUtils;

public class StringsUtils {
    
    @NotNull
    public static Set<String> getStrings(@Nullable final Object input) {
        Set<String> strings = new LinkedHashSet<>();
        if (input != null) {
            Class clazz = input.getClass();
            if (Collection.class.isAssignableFrom(clazz)) {
                // Try to convert from a collection
                for (Object obj : (Collection)input) {
                    if (obj != null) {
                        strings.add(obj.toString());
                    }
                }
            } else if (Object[].class.isAssignableFrom(clazz)) {
                // Try to convert from an array
                for (Object obj : (Object[]) input) {
                    if (obj != null) {
                        strings.add(obj.toString());
                    }
                }
            } else if (String.class.isAssignableFrom(clazz)) {
                // Try to convert from a CSV string
                for (String str : ((String)input).split(",")) {
                    if (StringUtils.isNotBlank(str)) {
                        strings.add(str.trim());
                    }
                }
            }
        }
        return strings;
    }

}
