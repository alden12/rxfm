import { elementMetadataService, TestElementMetadataService } from "./metadata";

describe('metadata', () => {
  it('should exist when imported', () => {
    expect(elementMetadataService).toBeTruthy();
  })

  it('should correctly create children metadata when passed in for an element', () => {
    const metadataService = new TestElementMetadataService();
    const element = document.createElement('div');
    const symbol = Symbol('Test Chilren Operator');
    metadataService.setChildren(element, symbol, []);

    expect(metadataService.inspectMetadata(element)?.children.blocks[0].symbol).toBe(symbol);
  });

  it('should put the block for a second children instance first', () => {
    const metadataService = new TestElementMetadataService();
    const element = document.createElement('div');
    const symbol1 = Symbol('Test Chilren Operator');
    const symbol2 = Symbol('Test Chilren Operator');
    metadataService.setChildren(element, symbol1, []);
    metadataService.setChildren(element, symbol2, []);

    expect(metadataService.inspectMetadata(element)?.children.blocks[0].symbol).toBe(symbol2);
    expect(metadataService.inspectMetadata(element)?.children.blocks[1].symbol).toBe(symbol1);
  });
});
