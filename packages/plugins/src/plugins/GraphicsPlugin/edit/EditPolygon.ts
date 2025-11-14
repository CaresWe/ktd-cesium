import * as Cesium from 'cesium'
import { EditPolyline } from './EditPolyline'

/**
 * b‘{
 * çê EditPolyline,;:+/ hasClosure=true (í)
 */
export const EditPolygon = EditPolyline.extend({
  hasClosure: true, // /&í

  /**
   * ·Öþbùa
   */
  getGraphic(this: any) {
    return this.entity.polygon
  },

  /**
   * ô°‘ö„^'
   */
  updateAttrForEditing(this: any) {
    // è: depthFailMaterial ý( CallbackProperty
    if (
      this.entity.attribute.type === 'polygon' &&
      Cesium.defined(this.entity.polygon.hierarchy)
    ) {
      // ùŽ polygon,ô¥¾n hierarchy
      this.entity.polygon.hierarchy = this.getPosition()
    }
  },

  /**
   * ‘Ó_(
   */
  finish(this: any) {
    this.entity._positions_draw = this.getPosition()

    const entity = this.entity
    if (this.entity.attribute.type === 'polygon') {
      // ùŽ polygon,( CallbackProperty e¨ô°
      entity.polygon.hierarchy = new Cesium.CallbackProperty((time) => {
        return new Cesium.PolygonHierarchy(entity._positions_draw)
      }, false)
    }
  },

  /**
   * Mnlb:Þýp
   */
  changePositionsToCallback(this: any) {
    this._positions_draw = this.entity._positions_draw

    if (!this._positions_draw) {
      const hierarchy = this.getGraphic().hierarchy
      if (hierarchy) {
        const hierarchyValue = hierarchy.getValue
          ? hierarchy.getValue(this.viewer.clock.currentTime)
          : hierarchy

        this._positions_draw =
          hierarchyValue && hierarchyValue.positions
            ? hierarchyValue.positions
            : hierarchyValue
      }
    }
  }
})
