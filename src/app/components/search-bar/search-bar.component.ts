import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-search-bar',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './search-bar.component.html',
    styleUrls: ['./search-bar.component.scss']
})
export class SearchBarComponent {
    @Input() termoBusca: string = '';
    @Input() carregando: boolean = false;
    @Input() mapaCarregado: boolean = false;

    @Output() termoBuscaChange = new EventEmitter<string>();
    @Output() buscar = new EventEmitter<void>();

    onTermoBuscaChange(value: string): void {
        this.termoBuscaChange.emit(value);
    }

    onBuscar(): void {
        this.buscar.emit();
    }
}
