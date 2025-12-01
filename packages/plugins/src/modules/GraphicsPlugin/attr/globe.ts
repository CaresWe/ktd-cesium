import * as Cesium from 'cesium'

/**
 * 设置填充材质
 */
export function setFillMaterial(
  entityattr: Record<string, unknown>,
  style: Record<string, unknown>
): Record<string, unknown> {
  if (style.material) {
    // material 属性优先
    entityattr.material = style.material
    return entityattr
  }

  if (style.color || style.fillType) {
    const color = Cesium.Color.fromCssColorString(String(style.color || '#FFFF00')).withAlpha(
      Number(style.opacity || 1.0)
    )

    switch (style.fillType) {
      default:
      case 'color': // 纯色填充
        entityattr.material = new Cesium.ColorMaterialProperty(color)
        break
      case 'image': // 图片填充
        entityattr.material = new Cesium.ImageMaterialProperty({
          image: style.image as string,
          color: Cesium.Color.fromCssColorString('#FFFFFF').withAlpha(Number(style.opacity || 1.0))
        })
        break
      case 'grid': {
        // 网格
        const lineCount = Number(style.grid_lineCount || 8)
        const lineThickness = Number(style.grid_lineThickness || 2.0)
        entityattr.material = new Cesium.GridMaterialProperty({
          color: color,
          cellAlpha: Number(style.grid_cellAlpha || 0.1),
          lineCount: new Cesium.Cartesian2(lineCount, lineCount),
          lineThickness: new Cesium.Cartesian2(lineThickness, lineThickness)
        })
        break
      }
      case 'checkerboard': {
        // 棋盘
        const repeat = Number(style.checkerboard_repeat || 4)
        entityattr.material = new Cesium.CheckerboardMaterialProperty({
          evenColor: color,
          oddColor: Cesium.Color.fromCssColorString(String(style.checkerboard_oddcolor || '#ffffff')).withAlpha(
            Number(style.opacity || 1.0)
          ),
          repeat: new Cesium.Cartesian2(repeat, repeat)
        })
        break
      }
      case 'stripe': // 条纹
        entityattr.material = new Cesium.StripeMaterialProperty({
          evenColor: color,
          oddColor: Cesium.Color.fromCssColorString(String(style.stripe_oddcolor || '#ffffff')).withAlpha(
            Number(style.opacity || 1.0)
          ),
          repeat: Number(style.stripe_repeat || 6)
        })
        break
    }
  }

  // 如果未设置任何 material，默认设置随机颜色
  if (entityattr.material == null || style.randomColor) {
    entityattr.material = new Cesium.ColorMaterialProperty(
      Cesium.Color.fromRandom({
        minimumRed: Number(style.minimumRed || 0.0),
        maximumRed: Number(style.maximumRed || 0.75),
        minimumGreen: Number(style.minimumGreen || 0.0),
        maximumGreen: Number(style.maximumGreen || 0.75),
        minimumBlue: Number(style.minimumBlue || 0.0),
        maximumBlue: Number(style.maximumBlue || 0.75),
        alpha: Number(style.opacity || 1.0)
      })
    )
  }

  return entityattr
}
