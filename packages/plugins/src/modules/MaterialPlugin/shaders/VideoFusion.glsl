uniform sampler2D videoTexture;
uniform float opacity;
uniform float brightness;
uniform float contrast;
uniform float saturation;
uniform float hue;

// 色相旋转矩阵
vec3 adjustHue(vec3 color, float hueShift) {
  float angle = hueShift * 3.14159265 / 180.0;
  float s = sin(angle);
  float c = cos(angle);
  vec3 weights = vec3(0.299, 0.587, 0.114);
  vec3 axis = normalize(vec3(1.0, 1.0, 1.0));
  mat3 rotation = mat3(
    c + (1.0 - c) * axis.x * axis.x,
    (1.0 - c) * axis.x * axis.y - s * axis.z,
    (1.0 - c) * axis.x * axis.z + s * axis.y,
    (1.0 - c) * axis.y * axis.x + s * axis.z,
    c + (1.0 - c) * axis.y * axis.y,
    (1.0 - c) * axis.y * axis.z - s * axis.x,
    (1.0 - c) * axis.z * axis.x - s * axis.y,
    (1.0 - c) * axis.z * axis.y + s * axis.x,
    c + (1.0 - c) * axis.z * axis.z
  );
  return rotation * color;
}

czm_material czm_getMaterial(czm_materialInput materialInput) {
  czm_material material = czm_getDefaultMaterial(materialInput);

  vec4 videoColor = texture(videoTexture, materialInput.st);

  // 亮度调整
  vec3 color = videoColor.rgb * brightness;

  // 对比度调整
  color = (color - 0.5) * contrast + 0.5;

  // 饱和度调整
  float gray = dot(color, vec3(0.299, 0.587, 0.114));
  color = mix(vec3(gray), color, saturation);

  // 色相调整
  if (abs(hue) > 0.001) {
    color = adjustHue(color, hue);
  }

  material.diffuse = color;
  material.alpha = videoColor.a * opacity;

  return material;
}
