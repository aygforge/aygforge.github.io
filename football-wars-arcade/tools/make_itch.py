# Builds FootballWars_Full_Test_itch.zip: index.html at the ZIP root (the complete single-file game, no other assets needed).
import zipfile, os
root = os.path.join(os.path.dirname(__file__), '..')
src = os.path.join(root, 'FootballWars_Full_Test.html'); out = os.path.join(root, 'FootballWars_Full_Test_itch.zip')
with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
    z.write(src, 'index.html')
with zipfile.ZipFile(out) as z: print(out, [(i.filename, i.file_size) for i in z.infolist()])
