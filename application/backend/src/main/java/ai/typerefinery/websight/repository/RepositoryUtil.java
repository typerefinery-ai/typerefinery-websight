package ai.typerefinery.websight.repository;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.OutputStream;
import java.io.PrintWriter;
import java.net.URISyntaxException;
import java.util.Properties;

import javax.jcr.RepositoryException;
import javax.jcr.Session;

import org.apache.jackrabbit.vault.fs.api.RepositoryAddress;
import org.apache.jackrabbit.vault.fs.api.VaultFile;
import org.apache.jackrabbit.vault.fs.api.VaultFileSystem;
import org.apache.jackrabbit.vault.fs.api.VaultFsConfig;
import org.apache.jackrabbit.vault.fs.config.ConfigurationException;
import org.apache.jackrabbit.vault.fs.config.DefaultMetaInf;
import org.apache.jackrabbit.vault.fs.config.MetaInf;
import org.apache.jackrabbit.vault.fs.io.AbstractExporter;
import org.apache.jackrabbit.vault.fs.io.Archive;
import org.apache.jackrabbit.vault.fs.io.FileArchive;
import org.apache.jackrabbit.vault.fs.io.Importer;
import org.apache.jackrabbit.vault.fs.io.PlatformExporter;
import org.apache.jackrabbit.vault.packaging.ExportOptions;
import org.apache.jackrabbit.vault.fs.Mounter;
import org.apache.jackrabbit.vault.util.DefaultProgressListener;
import org.apache.sling.api.resource.ResourceResolver;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class RepositoryUtil {
    final static Logger log = LoggerFactory.getLogger(RepositoryUtil.class);

    /**
     * use jackrabit platfromexporter to export the repository
     * @throws IOException
     * @throws RepositoryException
     */
    public static void jcrExport(ResourceResolver resourceResolver, String localpath, String jcrPath, boolean verbose) throws RepositoryException, IOException {
        Session session = null;
        VaultFileSystem jcrfs = null;
        File exportRoot = new File(localpath);
        // create exportRoot if not exist
        if (!exportRoot.exists()) {
            exportRoot.mkdirs();
        }

        AbstractExporter exporter = new PlatformExporter(exportRoot);
        try {
            session = getSession(resourceResolver);

            // get jcrpath in exportRoot
            ExportOptions opts = new ExportOptions();            
            opts.setRootPath("/");


            Properties props = new Properties();
            props.setProperty("group", "typerefinery");
            props.setProperty("name", "typerefinery");
            DefaultMetaInf metaInf = new DefaultMetaInf();
            metaInf.setProperties(props);
            
            opts.setMetaInf(metaInf);
            
            // get mount path, this will be used to connect to JCR
            RepositoryAddress addr;
            try {
                String mountPath = opts.getMountPath();
                if (mountPath == null || mountPath.length() == 0) {
                    mountPath = "/";
                }
                addr = new RepositoryAddress("/" + session.getWorkspace().getName() + mountPath);
            } catch (URISyntaxException e) {
                throw new IllegalArgumentException(e);
            }

            VaultFsConfig config = opts.getMetaInf().getConfig();

            // get jcrfs
            jcrfs = Mounter.mount(config, metaInf.getFilter(), addr, opts.getRootPath(), session);
            VaultFile vaultFile = jcrfs.getFile(jcrPath);

            // set exporter
            ((PlatformExporter) exporter).setPruneMissing(true);
            if (jcrPath == null || !jcrPath.startsWith("/")) {
                exporter.setRelativePaths(true);
            }

            log.info("Exporting {} to {}", vaultFile.getPath(), exportRoot.getCanonicalPath());

            PrintWriter logStream = new PrintWriter(new OutputStream() {
                @Override
                public void write(int b) throws IOException {
                    log.info("{}", (char) b);
                }
            });
            
            // exporter.setVerbose(new DefaultProgressListener(logStream));

            //do not export package meta
            // exporter.setNoMetaInf(true);

            exporter.setProperties(props);                    

            exporter.export(vaultFile, false);

        } finally {
            if (exporter != null) {
                exporter.close();
            }
            if (jcrfs != null) {
                jcrfs.unmount();
            }
            ungetSession(session);
        }

    }

    public static void jcrImport(ResourceResolver resourceResolver, String localpath, String jcrPath, boolean verbose) throws RepositoryException, IOException, ConfigurationException {
        Session session = null;
        File exportRoot = new File(localpath);

        Importer importer = new Importer();
        importer.getOptions().setListener(new DefaultProgressListener());

        Archive archive = new FileArchive(exportRoot);
        try {
            session = getSession(resourceResolver);
            importer.run(archive, session, jcrPath);
        } finally {
            ungetSession(session);
        }

    }


    public static File getFile(File file, String path, boolean mustExist)
            throws IOException {
        File newFile = new File(path);
        if (newFile.isAbsolute()) {
            newFile = newFile.getCanonicalFile();
        } else {
            newFile = new File(file, path).getCanonicalFile();
        }
        if (!newFile.exists() && mustExist) {
            throw new FileNotFoundException(newFile.getPath());
        }
        return newFile;
    }

    public static Session getSession(ResourceResolver resourceResolver) throws RepositoryException {
        Session session = resourceResolver.adaptTo(Session.class);
        if (session == null) {
            throw new RepositoryException("could not obtain a session from calling user " + resourceResolver.getUserID());
        }
        return session;
    }

    public static void ungetSession(Session session) {
        if (session != null) {
            try {
                if (session.hasPendingChanges()) {
                    session.save();
                }
            } catch (RepositoryException e) {
                log.error("Cannot save session", e);
            }
        }
    }

    
}
