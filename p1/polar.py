import numpy as np
import json

# Params
num_points = 1000
scaling = 1

# Points ----------------------------------------------------------------------
# Interval for polar graphing, T for theta[]
T = np.linspace(0, 2*np.pi, num=num_points)
# Points in polar coordinates
R = (1+0.7*np.cos(8*T))*(1+0.1*np.cos(24*T))*(0.9+0.06*np.cos(200*T))*(1+np.sin(T))
# Points in Cartesian coords
X = R*np.cos(T)*scaling
Y = R*np.sin(T)*scaling
# reshape from [x1,x2,...] [y1,y2,...] to [x1, y1, 0, x2, y2, 0,...]
points = np.zeros(X.shape[0] + Y.shape[0] + X.shape[0], dtype=X.dtype)
points[::3] = X
points[1::3] = Y
points[2::3] = 0.0
# Convert to json and write to text file
points = points.tolist()

# Colors ----------------------------------------------------------------------
colors = np.zeros([num_points, 4], dtype=np.single)
colors[:, [1,3]] = 1.0
colors = colors.flatten().tolist()

with open('points.json', 'w') as f:
    json.dump(points, f)
with open('colors.json', 'w') as f:
    json.dump(colors, f)
