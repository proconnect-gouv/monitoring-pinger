import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Incident {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    monitorId: number;

    @Column()
    monitorName: string;

    @Column()
    cause: string;

    @Column({ default: false })
    hasBeenNotified: boolean;

    @CreateDateColumn({ type: 'timestamptz' })
    startedAt: string;

    @Column({ type: 'timestamptz', nullable: true })
    endedAt: string | null;
}
