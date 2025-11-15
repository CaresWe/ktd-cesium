/**
 * Tooltip 提示消息
 */
export const message = {
  draw: {
    point: {
      start: '单击 完成绘制'
    },
    polyline: {
      // 线面
      start: '单击 开始绘制',
      cont: '单击增加点,右击删除点',
      end: '单击增加点,右击删除点<br/>双击完成绘制',
      end2: '单击完成绘制'
    }
  },
  edit: {
    start: '单击后 激活编辑<br/>右击 单击菜单删除',
    end: '释放后 完成修改'
  },
  dragger: {
    def: '拖动该点后<br/>修改位置 ', // 默认
    moveAll: '拖动该点后<br/>整体平移',
    addMidPoint: '拖动该点后<br/>增加点',
    moveHeight: '拖动该点后<br/>修改高度',
    editRadius: '拖动该点后<br/>修改半径',
    editHeading: '拖动该点后<br/>修改方向',
    editScale: '拖动该点后<br/>修改缩放比例'
  },
  del: {
    def: '<br/>右击 删除该点',
    min: '无法删除,点数量不能少于'
  }
}
