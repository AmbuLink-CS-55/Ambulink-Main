# Contributing
In the [**Issues**](https://github.com/AmbuLink-CS-55/AmbuLink-mono/issues) tab, find feature requests or bug reports. Assign yourself an issue, or ask someone to assign one if you don't want to pick. You can also create an issue for a bug or feature and assign it to your self.

You will have to create a new branch for each feature.

Before creating a branch remember to pull any changes made to masters
```sh
git pull origin master
```

Create a new branch `<Name>/<Feature>` for example `themiya/new-button`.
```sh
git checkout -b <branch-name> # when running make sure you are in master branch
```
Branch off master, it's easier to manage things that way.

You can do any code modifications in this branch now. 
You can commit inside this branch using
```sh
git add .
git commit -m "commit message"
```

After finishing the feature, upload the branch to github (this does not create a pull request)
```sh
git push -u origin <branch-name>
```

Before creating a pull request check for merge conflicts
```sh
git pull origin master # merges master branch with your feature branch
```
If there are conflicts, try to fix them.

After fixing merge conflicts run this again to update your feature branch.
```sh
git push -u origin <branch-name>
```
it will show up in https://github.com/AmbuLink-CS-55/AmbuLink-mono/, there should be a create PR button next to your branch.

add a title and a description and create a PR.
