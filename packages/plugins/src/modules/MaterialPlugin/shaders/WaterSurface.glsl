uniform sampler2D normalMap;
uniform vec4 baseWaterColor;
uniform vec4 blendColor;
uniform float frequency;
uniform float animationSpeed;
uniform float amplitude;
uniform float specularIntensity;
uniform float fadeFactor;
uniform float flowDirection;
uniform float flowSpeed;

czm_material czm_getMaterial(czm_materialInput materialInput) {
  czm_material material = czm_getDefaultMaterial(materialInput);

  float time = czm_frameNumber * animationSpeed;

  // 计算流动方向
  float dirRad = flowDirection * 3.14159265 / 180.0;
  vec2 flowDir = vec2(cos(dirRad), sin(dirRad)) * flowSpeed;

  // 动态UV坐标
  vec2 uv = materialInput.st;
  uv.x += sin(uv.y * frequency + time) * amplitude;
  uv.y += cos(uv.x * frequency + time * 0.8) * amplitude;
  uv += flowDir * time * 0.01;

  // 采样法线贴图
  vec3 normalValue = texture(normalMap, fract(uv)).rgb * 2.0 - 1.0;

  // 计算反射
  vec3 viewDir = normalize(materialInput.positionToEyeEC);
  vec3 reflectDir = reflect(-viewDir, normalValue);
  float specular = pow(max(dot(reflectDir, vec3(0.0, 0.0, 1.0)), 0.0), 32.0) * specularIntensity;

  // 混合颜色
  vec4 waterColor = mix(baseWaterColor, blendColor, fadeFactor);

  material.diffuse = waterColor.rgb + vec3(specular);
  material.alpha = waterColor.a;
  material.specular = specularIntensity;

  return material;
}
