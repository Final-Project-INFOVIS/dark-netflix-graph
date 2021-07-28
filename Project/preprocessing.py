import json


def collect_edges_id():
    with open("data/graph.json") as json_file:
        json_object = json.load(json_file)
        edges = json_object["edges"]
        id_set = set()
        for edge in edges:
            id_set.add(edge["source"])
            id_set.add(edge["target"])

        print(id_set)
        json_file.close()

def collect_edges_type():
    with open("data/graph.json") as json_file:
        json_object = json.load(json_file)
        edges = json_object["edges"]
        type_set = set()
        for edge in edges:
            type_set.add(edge["type"])

        print(type_set)
        json_file.close()


class Node:
    def __init__(self, id):
        self.id = id


class Edge:
    def __init__(self, source, target, type):
        self.source = source
        self.target = target
        self.type = type

    def __repr__(self):
        return "Edge([{0},{1},{2}])".format(self.source, self.target, self.type)


with open("data/data.json") as json_file:
    json_object = json.load(json_file)
    json_file.close()

name_to_character = dict()
nodes = []
edges = []
counter_id = 0
for obj in json_object["characters"]:
    keys = obj.keys()
    counter_id += 1
    node = Node(counter_id)
    if "name" in keys:
        name = str(obj["name"])
        node.name = name
        name_to_character[name] = node
    if "lastname" in keys:
        family = obj["lastname"]
        node.family = family
    if "years" in keys:
        years = obj["years"]
        node.years = years
    if "gender" in keys:
        gender = obj["gender"]
        node.gender = gender
    if "alias" in keys:
        alias = obj["alias"]
        node.alias = alias
    if "sicMundus" in keys:
        node.sicMundus = True
    else:
        node.sicMundus = False
    nodes.append(node)

for obj in json_object["characters"]:
    keys = list(obj.keys())

    if "siblings" in keys:
        source = name_to_character[obj["name"]].id
        siblings = obj["siblings"]
        for sib in siblings:
            target = name_to_character[sib].id
            edge = Edge(source, target, "is_sibling")
            edges.append(edge)

    if "parents" in keys:
        source = name_to_character[obj["name"]].id
        parents = obj["parents"]
        for par in parents:
            target = name_to_character[par].id
            edge = Edge(source, target, "parent")
            edges.append(edge)

    if "parentOf" in keys:
        source = name_to_character[obj["name"]].id
        parents = obj["parentOf"]
        if type(parents) is list:
            for par in parents:
                target = name_to_character[par].id
                edge = Edge(source, target, "parentOf")
                edges.append(edge)
        else:
            target = name_to_character[parents].id
            edge = Edge(source, target, "parentOf")
            edges.append(edge)

    if "killedBy" in keys:
        source = name_to_character[obj["name"]].id
        killers = obj["killedBy"]
        for k in killers:
            target = name_to_character[k].id
            edge = Edge(source, target, "killedBy")
            edges.append(edge)

    if "married" in keys:
        source = name_to_character[obj["name"]].id
        ms = obj["married"]
        if type(ms) is list:
            for m in ms:
                target = name_to_character[m].id
                edge = Edge(source, target, "married_to")
                edges.append(edge)
        else:
            target = name_to_character[ms].id
            edge = Edge(source, target, "married_to")
            edges.append(edge)

with open("data/nodes.json", 'w') as outfile:
    json_data = json.dumps([n.__dict__ for n in nodes], default=lambda o: o.__dict__, indent=4)
    outfile.write(json_data)
    outfile.close()

with open("data/edges.json", 'w') as outfile:
    json_data = json.dumps([e.__dict__ for e in edges], default=lambda o: o.__dict__, indent=4)
    outfile.write(json_data)
    outfile.close()

# with open("data/graph.json","w") as json_file:
# json_file.write(json.dumps(graph))
# json_file.close()


def add_ids_to_edges():
    with open("data/graph.json") as json_file:
        json_object = json.load(json_file)
        edges = json_object["edges"]
        count = 0
        new_string = ""
        for edge in edges:
            edge = str(edge)
            count += 1
            id = "{ \'id\'" + ": " +  str(count) + ", "
            new_string = new_string + id + edge[1:] + ",\n"

        print(new_string)

        json_file.close()


if __name__ == '__main__':
    add_ids_to_edges()