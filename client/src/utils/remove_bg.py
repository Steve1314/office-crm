from PIL import Image

img = Image.open('src/assets/images/logo.png').convert('RGBA')
datas = img.getdata()

new_data = []
for item in datas:
    r, g, b, a = item
    # Check if pixel is white or close to white
    if r > 235 and g > 235 and b > 235:
        # Transparent
        new_data.append((r, g, b, 0))
    elif r > 215 and g > 215 and b > 215:
        # Smooth alpha edge
        alpha = int((240 - max(r, g, b)) / 25.0 * 255)
        new_data.append((r, g, b, max(0, min(255, alpha))))
    else:
        new_data.append(item)

img.putdata(new_data)
img.save('src/assets/images/logo.png', 'PNG')
img.save('public/logo.png', 'PNG')
print("Pure PIL transparent logo created successfully!")
