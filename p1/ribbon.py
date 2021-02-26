import numpy as np
import json

plus_y = 0.3
radius = 1.1
height = 0.1
offset = radius/(height * np.tan(np.pi/6))
num_points = 100

# leave a gap because it's a strip
T = np.linspace(0, 6, num=num_points)
p1 = [np.cos(T), plus_y, np.sin(T)]
p2 = [np.cos(T+offset), plus_y + height, np.sin(T+offset)]




# Visualization 
# import matplotlib.pyplot as plt
# from mpl_toolkits.mplot3d import Axes3D
# fig = plt.figure()
# ax = fig.add_subplot(111, projection='3d')
# ax.plot(p1[:,0], p1[:,1], p1[:,2], 'x')
# ax.plot(p2[:,0], p2[:,1], p2[:,2], 'rx')
# plt.show()