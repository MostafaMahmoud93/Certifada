namespace Certifada.Infrastructure.Abstractions;
public class FileManager : IFileManager
{
    public async Task<string> SaveFile(string root, string folderName, string fileName, IFormFile fileContent)
    {
        string filePath = Path.Combine(folderName, fileName);
        string filePathRoot = Path.Combine(root, folderName, fileName);
        CreateDirectory(Path.GetDirectoryName(filePathRoot));
        if (FileExists(filePathRoot))
        {
            DeleteFile(filePathRoot);
        }
        CreateFile(filePathRoot, await GetBytesFromFormFileAsync(fileContent));
        return filePath;
    }
    public void CreateDirectory(string path)
    {
        Directory.CreateDirectory(path);
    }

    public bool DirectoryExists(string path)
    {
        return Directory.Exists(path);
    }

    public void DeleteDirectory(string path)
    {
        Directory.Delete(path, true);
    }

    public void CopyDirectory(string sourcePath, string destinationPath)
    {
        Directory.CreateDirectory(destinationPath);

        foreach (string file in Directory.GetFiles(sourcePath))
        {
            string fileName = Path.GetFileName(file);
            string destinationFile = Path.Combine(destinationPath, fileName);
            File.Copy(file, destinationFile);
        }

        foreach (string directory in Directory.GetDirectories(sourcePath))
        {
            string directoryName = Path.GetFileName(directory);
            string destinationDirectory = Path.Combine(destinationPath, directoryName);
            CopyDirectory(directory, destinationDirectory);
        }
    }

    public void MoveDirectory(string sourcePath, string destinationPath)
    {
        Directory.Move(sourcePath, destinationPath);
    }

    public void CreateFile(string path, byte[] content)
    {
        File.WriteAllBytes(path, content);
    }

    public bool FileExists(string path)
    {
        return File.Exists(path);
    }

    public byte[] ReadFile(string path)
    {
        return File.ReadAllBytes(path);
    }

    public void WriteFile(string path, byte[] content)
    {
        File.WriteAllBytes(path, content);
    }

    public void DeleteFile(string path)
    {
        File.Delete(path);
    }

    public void CopyFile(string sourcePath, string destinationPath)
    {
        File.Copy(sourcePath, destinationPath, true);
    }

    public void MoveFile(string sourcePath, string destinationPath)
    {
        File.Move(sourcePath, destinationPath);
    }
    private async Task<byte[]> GetBytesFromFormFileAsync(IFormFile file)
    {
        using var memoryStream = new MemoryStream();
        await file.CopyToAsync(memoryStream);
        return memoryStream.ToArray();
    }
}
