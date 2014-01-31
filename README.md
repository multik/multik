# Multik

Multi-repository management command-line tool.

This is handy when you're working on multiple SCM repositories and/or on multiple computers.
E.g. rather than updating each repository one by one, it's easier to just run `mk update` and update all of them in one go. Rather than checking for uncommitted local changes one by one, it's easier to just run `mk status` and check all in one go.
And if you often switch between multiple computers, simply use the same `multik.json` file on those computers and easily manage the same set of repositories.

Installation
------------
Much more information is available via `mk help` once it's installed. This is just enough to get you started.

    [sudo] npm install -g multik

Usage
-----

Initialise local repositories:

    mk install
    
Update local repositories with changes from remote repositories:

    mk update

Display the changes in local repositories:

    mk status

Configuration
-------------

Repositories can be configured in multik.json file:

    {
        "dependencies": {
            "demo-repo1": {
                "repo": "https://github.com/multik/demo-repo1.git",
                "version": "master"
            },
            "demo-repo2": {
                "repo": "https://github.com/multik/demo-repo2.git",
                "version": "master"
            },
            "demo-repo3": {
                "repo": "https://github.com/multik/demo-repo2.git",
                "version": "master"
            }
        }
    }

## License

Copyright (c) 2014 Alexander Kuzmin <roosit@abricos.org>

Licensed under the MIT License
