//2个图片的叠加融合
czm_material czm_getMaterial(czm_materialInput materialInput)
{
czm_material material = czm_getDefaultMaterial(materialInput);
vec2 st = repeat * materialInput.st;
vec4 colorImage = texture(image, vec2(fract((axisY?st.t:st.s) - time), st.t));
if(color.a == 0.0)
{
    material.alpha = colorImage.a;
    material.diffuse = colorImage.rgb;
}
else
{
    material.alpha = colorImage.a * color.a;
    material.diffuse = max(color.rgb * material.alpha * 3.0, color.rgb);
}
vec4 colorBG = texture(image2,materialInput.st);
if(colorBG.a>0.5){
    material.diffuse = bgColor.rgb;
}
return material;
}
