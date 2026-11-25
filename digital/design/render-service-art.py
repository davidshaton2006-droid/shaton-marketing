"""Seven independent original 3D compositions for Optical Foundry.
Blender background: blender -b -t 2 -P render-service-art.py -- ai output.png
The source is procedural, no external models or stock art."""
import bpy, math, sys, random
from mathutils import Vector
from pathlib import Path
kind, output=sys.argv[sys.argv.index('--')+1:]
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
scene=bpy.context.scene
scene.render.engine='CYCLES';scene.cycles.samples=36;scene.cycles.use_denoising=True
scene.render.resolution_x=960;scene.render.resolution_y=720;scene.render.resolution_percentage=100
scene.render.film_transparent=True
scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_mode='RGBA'
scene.view_settings.view_transform='AgX'
world=bpy.data.worlds.new('Soft studio');scene.world=world;world.use_nodes=True
world.node_tree.nodes.get('Background').inputs[0].default_value=(.78,.85,1,1);world.node_tree.nodes.get('Background').inputs[1].default_value=.35
def material(name,color,metal=0,rough=.26,trans=0):
    m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*color,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
    p.inputs['Transmission Weight'].default_value=trans;p.inputs['IOR'].default_value=1.46
    return m
titanium=material('Satin titanium',(.62,.67,.74),.88,.24)
chrome=material('Polished titanium',(.78,.84,.92),.98,.13)
glass=material('Clear optical glass',(.79,.88,1),.02,.10,.93)
ceramic=material('Porcelain',(.84,.88,.93),.08,.28)
colors={'ai':(.28,.19,.54),'automation':(.035,.17,.63),'software':(.13,.39,.36),'web':(.05,.24,.62),'commerce':(.49,.29,.12),'telegram':(.045,.32,.57),'integration':(.06,.4,.36)}
accent=material('Spectral accent',colors[kind],.61,.22)
def finish(o,mat):
    o.data.materials.append(mat)
    if o.type=='MESH':
        for p in o.data.polygons:p.use_smooth=True
    return o
def box(loc,dim,mat,bev=.1,rot=None):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.dimensions=dim;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    b=o.modifiers.new('Precision bevel','BEVEL');b.width=bev;b.segments=5
    o.modifiers.new('Weighted normals','WEIGHTED_NORMAL')
    if rot:o.rotation_euler=rot
    return finish(o,mat)
def sphere(loc,r,mat):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=48,ring_count=24,radius=r,location=loc);return finish(bpy.context.object,mat)
def torus(loc,major,minor,mat,rot=(0,0,0)):
    bpy.ops.mesh.primitive_torus_add(major_segments=72,minor_segments=20,major_radius=major,minor_radius=minor,location=loc,rotation=rot);return finish(bpy.context.object,mat)
def rod(a,b,r,mat):
    a,b=Vector(a),Vector(b);v=b-a;bpy.ops.mesh.primitive_cylinder_add(vertices=40,radius=r,depth=v.length,location=(a+b)/2)
    o=bpy.context.object;o.rotation_euler=v.to_track_quat('Z','Y').to_euler();return finish(o,mat)
def curve(points,r,mat):
    c=bpy.data.curves.new('Optical conduit','CURVE');c.dimensions='3D';c.resolution_u=20;c.bevel_depth=r;c.bevel_resolution=5
    s=c.splines.new('BEZIER');s.bezier_points.add(len(points)-1)
    for p,co in zip(s.bezier_points,points):p.co=co;p.handle_left_type='AUTO';p.handle_right_type='AUTO'
    o=bpy.data.objects.new('Conduit',c);scene.collection.objects.link(o);o.data.materials.append(mat);return o
if kind=='ai':
    sphere((0,0,.05),.81,glass);sphere((0,0,.05),.46,accent)
    for i in range(3):torus((0,0,.05),1.12,.085,chrome,(.45+i*.62,.8-i*.35,i*1.05))
    for i in range(6):
        a=i*math.tau/6;p=(1.64*math.cos(a),1.64*math.sin(a),.18+.25*math.sin(a*2))
        rod((0,0,.05),p,.035,titanium);sphere(p,.19,accent if i%3==0 else chrome)
elif kind=='automation':
    for i,(x,y,z) in enumerate([(-1.55,-.22,-.35),(0,.35,.25),(1.55,-.12,.86)]):
        box((x,y,z),(1.1,1.1,.8),titanium,.16);box((x,y,z+.47),(.85,.85,.16),glass,.07);box((x,y,z+.57),(.36,.36,.08),accent,.035)
    curve([(-1.03,-.22,-.3),(-.62,-.22,-.3),(-.54,.35,.25)],.095,chrome)
    curve([(.55,.35,.25),(1.0,.35,.25),(1.01,-.12,.86)],.095,accent)
elif kind=='software':
    for i in range(4):
        z=-.85+i*.55;box((0,0,z),(2.7,1.85,.23),[titanium,glass,ceramic,glass][i],.12,(0,0,.11*i-.13))
        for x in [-.87,.87]:
            box((x,0,z+.15),(.32,.87,.045),accent,.025,(0,0,.11*i-.13))
    for x in [-1.02,1.02]:
        for y in [-.62,.62]:rod((x,y,-.9),(x,y,.85),.055,chrome)
elif kind=='web':
    box((-.35,0,.45),(3.05,.15,1.85),titanium,.11);box((-.35,-.092,.45),(2.84,.045,1.62),ceramic,.07)
    box((-.87,-.12,.68),(1.65,.035,.83),glass,.045);box((.25,-.13,.68),(.54,.035,.83),accent,.045)
    for i in range(3):box((-.65,-.13,-.04-i*.14),(1.6-i*.24,.04,.07),titanium,.02)
    box((-.35,.05,-.66),(.35,.3,.58),chrome,.05);box((-.35,.05,-.98),(1.2,.7,.1),titanium,.05)
    box((1.28,-.55,-.17),(.78,.16,1.48),chrome,.12,(0,0,-.16));box((1.28,-.645,-.17),(.65,.04,1.34),glass,.09,(0,0,-.16));box((1.28,-.67,-.45),(.48,.04,.25),accent,.05,(0,0,-.16))
elif kind=='commerce':
    box((-.65,0,-.75),(1.65,1.35,.2),titanium,.12);box((-.65,0,-.18),(1.5,1.2,1.05),glass,.12)
    for x,y,z in [(-1.0,-.19,-.16),(-.35,.23,-.12)]:box((x,y,z),(.5,.47,.58),accent,.09)
    torus((-.65,0,.47),.48,.065,chrome,(math.pi/2,0,0))
    box((1.06,-.18,.05),(1.05,.18,1.55),chrome,.12,(0,0,.14));box((1.06,-.29,.05),(.88,.035,1.38),ceramic,.08,(0,0,.14))
    for z in [.46,.15,-.16]:box((1.06,-.32,z),(.66,.035,.12),accent if z==-.16 else titanium,.04,(0,0,.14))
elif kind=='telegram':
    box((0,0,.07),(1.62,.22,2.85),chrome,.18,(0,0,-.13));box((0,-.13,.07),(1.42,.055,2.63),glass,.14,(0,0,-.13))
    box((0,-.17,.87),(1.15,.05,.44),accent,.09,(0,0,-.13))
    for x in [-.31,.31]:box((x,-.17,.18),(.51,.05,.61),ceramic,.085,(0,0,-.13))
    box((0,-.17,-.67),(1.16,.05,.33),accent,.08,(0,0,-.13))
    torus((1.15,.27,.8),.38,.065,glass,(math.pi/2,.2,0));sphere((1.15,.27,.8),.17,chrome)
else:
    box((0,0,0),(1.18,1.18,1.18),titanium,.2);box((0,0,.66),(.85,.85,.12),glass,.1)
    for i in range(4):
        a=i*math.pi/2+.42;p=(1.55*math.cos(a),1.55*math.sin(a),.22 if i%2 else -.3);box(p,(.8,.8,.68),chrome,.13,(0,0,a));box((p[0],p[1],p[2]+.39),(.49,.49,.1),accent,.05,(0,0,a))
        curve([(math.cos(a)*.57,math.sin(a)*.57,0),(math.cos(a)*1.05,math.sin(a)*1.05,0),p],.075,glass)
def area(name,loc,power,size,color,target=(0,0,0),shape='DISK',size_y=None):
    bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.name=name;o.data.energy=power;o.data.shape=shape;o.data.size=size;o.data.color=color
    if size_y is not None:o.data.size_y=size_y
    o.rotation_euler=(Vector(target)-o.location).to_track_quat('-Z','Y').to_euler()
area('Large upper softbox',(-4,-4,6),1150,5,(.93,.96,1))
area('Rim strip',(4,2,5),1400,4,(.73,.85,1),shape='RECTANGLE',size_y=1.2)
area('Warm reflected fill',(-4,3,1),800,3,(1,.91,.78))
area('Front strip',(2,-5,1),650,4,(1,1,1),shape='RECTANGLE',size_y=1)
bpy.ops.object.camera_add(location=(5.4,-8.3,4.5) if kind not in ('web','telegram','commerce') else (4.3,-8.9,3.3))
cam=bpy.context.object;cam.rotation_euler=(-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=5.35 if kind!='telegram' else 4.45;scene.camera=cam
scene.render.filepath=output
bpy.ops.render.render(write_still=True)
