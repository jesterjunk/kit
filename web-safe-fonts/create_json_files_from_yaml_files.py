import os
import yaml
import json


for file in os.listdir("."):

    if file.endswith(".yaml"):

        filename = os.path.splitext(file)[0]

        print(filename)

        with open(file, "r") as stream:

            try:

                data = yaml.safe_load(stream)
                json_data = json.dumps(data, indent=4, sort_keys=False)

                json_file = open(f"{filename}.json", "w")
                json_file.write(json_data + "\n")
                json_file.close()

            except yaml.YAMLError as exc:

                print(exc)

    else:
        continue
