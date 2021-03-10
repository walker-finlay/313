import numpy as np
import json

# Params
num_lines = 2000
mean = [0, 0, 0]
cov = [[2, 0, 0], 
       [0, 2, 0], 
       [0, 0, 2]]  # diagonal covariance

p1 = np.random.multivariate_normal(mean, cov, num_lines)
p2 = p1 * (1.1+(np.linalg.norm(p1, axis=1)**4/128)[:,np.newaxis])

# Reshape & flatten
points = np.zeros([num_lines*2, 3])
points[::2] = p1
points[1::2] = p2
points = points.flatten()
# TODO: Is there a way to use less memory here?

# Colors 
# 4/3 for 4d color vector from 3d position vectors
colors = np.ones((int)(points.shape[0]*(4/3)), dtype=np.single).flatten()

points = points.tolist()
colors = colors.tolist()

with open('./line_points.json', 'w') as f:
    json.dump(points, f)
with open('./line_colors.json', 'w') as f:
    json.dump(colors, f)







# Visualization 
# import matplotlib.pyplot as plt
# from mpl_toolkits.mplot3d import Axes3D
# fig = plt.figure()
# ax = fig.add_subplot(111, projection='3d')
# ax.plot(p1[:,0], p1[:,1], p1[:,2], 'x')
# ax.plot(p2[:,0], p2[:,1], p2[:,2], 'rx')
# plt.show()
