package ai.typerefinery.websight.repository;

public class OpenPackageException extends Exception {
    private static final String SIMPLIFIED_MESSAGE = "Provided package is not valid";
    private final String packagePath;
 
    public OpenPackageException(String packagePath) {
       this.packagePath = packagePath;
    }
 
    public String getSimplifiedMessage() {
       return "Provided package is not valid";
    }
 
    public String getMessage() {
       return "Provided path: " + this.packagePath + " does not point to a valid package";
    }
}
