package io.typerefinery.websight.utils;

import java.util.Date;

import org.apache.jackrabbit.util.ISO8601;

public class DateUtil {
    
    public static final String DATE_FORMAT_ISO = "yyyy-MM-dd'T'HH:mm:ss'Z'";
    public static final String DATE_FORMAT_ISO_8601 = "YYYY-MM-DDThh:mm:ss.SSSTZD";
    public static final String DATE_FORMAT_ISO_8601_UTC = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'";
    public static final String DATE_FORMAT_ISO_8601_UTC_SHORT = "yyyy-MM-dd'T'HH:mm'Z'";


    public static String getIsoDate(Date date) {
        return ISO8601.format(date);
    }

}
