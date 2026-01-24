import math


def long_join(array: list, join: str) -> str:
    # long but not huge!
    result = ""
    first = True
    for ele in array:
        if first:
            first = False
        else:
            result += join
        result += "\n        " + str(ele)
    return result


def weight_of_poly(n: int, m: int, alpha: bool) -> float:
    if n == 1 and alpha and (m % 4 == 3):
        return 8.0
    if n == 1 and alpha and (m % 4 != 0):
        return 10.0
    if n == 1 and (not alpha) and ((m % 4 == 0) or (m % 4 == 3)):
        return 10.0
    if 1 <= n <= 4 and ((n - m) % 4) == 3:
            return 1.0
    if n <= 3 and ((n+m + (0 if alpha else 1)) % 4) == 0:
            return 1.0
    if n >= 5 and ((n+m + (0 if alpha else 1)) % 4) == 2:
            return 1.0
    return 3.0


if __name__ == "__main__":
    N = 10
    M = 20

    sq2 = math.sqrt(2) / 2

    points = {}
    for n in range(N):
        for m in range(M):
            dx = n * 3.0
            dy = 2 * sq2 * m
            points[(n, m, 1)] = [dx + 0.0, dy + 0.0]
            points[(n, m, 2)] = [dx + 0.5, dy + sq2]
            points[(n, m, 3)] = [dx + 1.5, dy + sq2]
            points[(n, m, 4)] = [dx + 2.0, dy + sq2 * 2]
    indices = {k: idx for (idx, k) in enumerate(points.keys())}
    values = [None for _ in points]
    for k in points.keys():
        values[indices[k]] = str(points[k])

    polys = []
    for n in range(N):
        for m in range(M):
            poly = [
                (n, m, 1),
                (n, m, 2),
                (n, m, 3),
                (n, m - 1, 4),
                (n, m - 1, 3),
                (n, m - 1, 2),
            ]
            poly = [indices.get(p) for p in poly]
            if None in poly:
                continue
            polys.append(str([weight_of_poly(n, m, True), poly]))
    for n in range(N):
        for m in range(M):
            poly = [
                (n, m, 3),
                (n, m, 4),
                (n + 1, m + 1, 1),
                (n + 1, m, 2),
                (n + 1, m, 1),
                (n, m - 1, 4),
            ]
            poly = [indices.get(p) for p in poly]
            if None in poly:
                continue
            polys.append(str([weight_of_poly(n, m, False), poly]))

    # print(indices)
    # print(values)
    print(f"const points = [{long_join(values, ',')}];")
    print(f"const polygons = [{long_join(polys, ',')}];")

    # print("kthxbay")
