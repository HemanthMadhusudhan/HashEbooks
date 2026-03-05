HashEbooksHashEbooks is a digital library management system designed to streamline the way users organize, verify, and interact with their electronic book collections. 
By utilizing unique hashing algorithms, the project ensures data integrity and prevents duplication within large personal or shared libraries.
## Project DescriptionManaging a growing collection of eBooks often leads to duplicate files, broken metadata, and disorganized directories. 
HashEbooks addresses these challenges by providing a robust framework to:Verify Integrity: Use cryptographic hashes to ensure that eBook files are not corrupted.
Deduplicate Libraries: Identify identical content even if filenames differ, saving storage space.
Metadata Management: Catalog titles, authors, and publication dates in a structured format.Search Optimization: Enable fast retrieval of documents through an indexed database.
## Getting Started### PrerequisitesPython 3.9+Pip (Python package manager)Git### InstallationClone the Repository:Bashgit clone https://github.com/HemanthMadhusudhan/HashEbooks.git
cd HashEbooks
Set Up a Virtual Environment (Recommended):Bashpython -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
Install Dependencies:Bashpip install -r requirements.txt
## UsageTo begin indexing your library, run the main script and point it to your books directory:Bashpython manage.py --scan /path/to/your/ebooks
### Core CommandsCommandDescription--scanScans a directory for new eBook files.
--listDisplays all books currently in the database.
--checkRuns a hash verification to check for file corruption.
--cleanRemoves duplicate entries based on file hash.
## ContributingContributions make the open-source community an amazing place to learn, inspire, and create.
Fork the Project.
Create your Feature Branch (git checkout -b feature/AmazingFeature).Commit your Changes (git commit -m 'Add some AmazingFeature').Push to the Branch (git push origin feature/AmazingFeature).
Open a Pull Request.
