import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-info-bar',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './info-bar.component.html',
    styleUrls: ['./info-bar.component.scss']
})
export class InfoBarComponent {
    @Input() quantidadeMarcadores: number = 0;
    @Input() totalBuscas: number = 0;
    @Input() mapaCarregado: boolean = false;

    @Output() limparMarcadores = new EventEmitter<void>();

    onLimpar(): void {
        this.limparMarcadores.emit();
    }
}
